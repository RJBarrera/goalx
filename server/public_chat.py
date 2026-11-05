import asyncio
import json
import os
import re
import secrets
import time

from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

CHAT_TZ = ZoneInfo("America/Mazatlan")
CHAT_FILE = Path(
    os.getenv(
        "GOALX_CHAT_FILE",
        str(Path(__file__).resolve().parent / "data" / "chat_messages.json"),
    )
)

ALLOWED_ORIGINS = {
    item.strip().rstrip("/")
    for item in os.getenv(
        "GOALX_CHAT_ALLOWED_ORIGINS",
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://goalx.up.railway.app",
    ).split(",")
    if item.strip()
}

MAX_MESSAGE_LENGTH = 300
MAX_HISTORY = 300
MAX_CONNECTIONS = 100


def current_day():
    return datetime.now(CHAT_TZ).date().isoformat()


class PublicChatRoom:
    def __init__(self):
        self.day = current_day()
        self.messages = []
        self.clients = set()
        self.lock = asyncio.Lock()
        self.send_lock = asyncio.Lock()
        self._load()

    def _load(self):
        if not CHAT_FILE.exists():
            return

        try:
            data = json.loads(CHAT_FILE.read_text(encoding="utf-8"))

            if data.get("day") == self.day:
                history = data.get("messages", [])
                if isinstance(history, list):
                    self.messages = history[-MAX_HISTORY:]
            else:
                self._save()

        except (OSError, ValueError, TypeError) as error:
            print("CHAT: No se pudo leer historial:", error)
            self.messages = []

    def _save(self):
        CHAT_FILE.parent.mkdir(parents=True, exist_ok=True)

        payload = {"day": self.day, "messages": self.messages[-MAX_HISTORY:]}

        temp_file = CHAT_FILE.with_name(CHAT_FILE.name + ".tmp")
        temp_file.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        os.replace(temp_file, CHAT_FILE)

    async def send_one(self, websocket, payload):
        async with self.send_lock:
            await websocket.send_json(payload)

    async def broadcast(self, payload):
        async with self.send_lock:
            for client in tuple(self.clients):
                try:
                    await client.send_json(payload)
                except Exception:
                    self.clients.discard(client)

    async def reset_if_needed(self):
        changed = False

        async with self.lock:
            today = current_day()

            if today != self.day:
                self.day = today
                self.messages = []
                await asyncio.to_thread(self._save)
                changed = True

        if changed:
            print("CHAT: Historial reiniciado:", self.day)
            await self.broadcast({"type": "reset", "day": self.day})

    async def connect(self, websocket):
        await self.reset_if_needed()
        await websocket.accept()

        async with self.send_lock:
            await websocket.send_json(
                {"type": "history", "day": self.day, "messages": list(self.messages)}
            )
            self.clients.add(websocket)

        await self.broadcast({"type": "presence", "online": len(self.clients)})

    async def disconnect(self, websocket):
        self.clients.discard(websocket)

        await self.broadcast({"type": "presence", "online": len(self.clients)})

    async def publish(self, nickname, content):
        await self.reset_if_needed()

        message = {
            "id": str(uuid4()),
            "nickname": nickname,
            "text": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        async with self.lock:
            self.messages.append(message)
            self.messages = self.messages[-MAX_HISTORY:]
            await asyncio.to_thread(self._save)

        await self.broadcast({"type": "message", "message": message})


CHAT_ROOM = PublicChatRoom()


@router.websocket("/ws/chat")
async def public_chat_endpoint(websocket: WebSocket):
    origin = websocket.headers.get("origin", "").rstrip("/")

    if origin not in ALLOWED_ORIGINS:
        await websocket.close(code=1008)
        return

    if len(CHAT_ROOM.clients) >= MAX_CONNECTIONS:
        await websocket.close(code=1013)
        return

    raw_nickname = websocket.query_params.get("nick", "")

    nickname = re.sub(r"[^\w .-]", "", raw_nickname).strip()[:20]

    if not nickname:
        nickname = f"Invitado{secrets.randbelow(10000):04d}"

    recent_messages = deque()
    last_message_time = 0.0

    try:
        await CHAT_ROOM.connect(websocket)

        while True:
            try:
                payload = await websocket.receive_json()
            except ValueError:
                await CHAT_ROOM.send_one(
                    websocket,
                    {"type": "error", "message": "Formato de mensaje inválido."},
                )
                continue

            if not isinstance(payload, dict):
                continue

            if payload.get("type") != "message":
                continue

            raw_text = payload.get("text", "")

            if not isinstance(raw_text, str):
                continue

            content = " ".join(raw_text.split())

            if not content:
                continue

            if len(content) > MAX_MESSAGE_LENGTH:
                await CHAT_ROOM.send_one(
                    websocket, {"type": "error", "message": "Máximo 300 caracteres."}
                )
                continue

            now = time.monotonic()

            while recent_messages and now - recent_messages[0] > 60:
                recent_messages.popleft()

            if now - last_message_time < 2 or len(recent_messages) >= 12:
                await CHAT_ROOM.send_one(
                    websocket,
                    {
                        "type": "error",
                        "message": "Estás enviando mensajes demasiado rápido.",
                    },
                )
                continue

            recent_messages.append(now)
            last_message_time = now

            await CHAT_ROOM.publish(nickname, content)

    except WebSocketDisconnect:
        pass

    except Exception as error:
        print("CHAT: Error de conexión:", error)

    finally:
        await CHAT_ROOM.disconnect(websocket)


async def chat_reset_worker():
    """Revisa el cambio de día cada 10 segundos."""
    while True:
        await CHAT_ROOM.reset_if_needed()
        await asyncio.sleep(10)
