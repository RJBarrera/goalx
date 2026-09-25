"""api_server"""

import traceback
import asyncio
import base64
import hashlib
import hmac
import json
import os
import shutil
import threading
import uuid
from contextlib import asynccontextmanager, suppress
import time

from pathlib import Path
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Header, Request, Response
from fastapi.responses import (
    FileResponse,
)
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from competition_config import (
    DEFAULT_COMPETITION_ID,
    get_competition,
    list_competitions,
)
from competition_manager import CompetitionManager
from live_service import get_quota_status
from live_intelligence import build_live_intelligence
from live_ai import answer_live_question
from prediccion_ligamx import analizar_h2h
from ml_models import preparar_features_al_vuelo

## Configuración
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

## Directorios
SERVER_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SERVER_DIR.parent


def _load_local_env():
    env_path = SERVER_DIR / ".env"

    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


_load_local_env()

## FrontEnd Compilado
FRONTEND_CANDIDATES = [
    # Proyecto normal
    PROJECT_DIR / "dist",
    # Release compilado
    PROJECT_DIR / "web",
]
FRONTEND_DIR = None

for candidate in FRONTEND_CANDIDATES:
    if candidate.is_dir():
        FRONTEND_DIR = candidate
        break


# COMPETICIONES
COMPETITION_MANAGER = CompetitionManager()
DEFAULT_RUNTIME = COMPETITION_MANAGER.get_runtime(DEFAULT_COMPETITION_ID)

# Compatibilidad con la estructura anterior
STATE = DEFAULT_RUNTIME.state
LIVE_SERVICE = DEFAULT_RUNTIME.live_service
HISTORY_SERVICE = DEFAULT_RUNTIME.history_service
DATASET_SYNC_SERVICE = DEFAULT_RUNTIME.dataset_sync_service

# Fuentes de transmisión
STREAMS_LOCKS = {}
STREAMS_LOCKS_GUARD = threading.RLock()

# Autenticación
AUTH_ADMIN_USER = os.getenv("GOALX_ADMIN_USER", "").strip()
AUTH_ADMIN_PASSWORD = os.getenv("GOALX_ADMIN_PASSWORD", "").strip()
AUTH_ADMIN_PASSWORD_HASH = os.getenv("GOALX_ADMIN_PASSWORD_HASH", "").strip()
AUTH_SESSION_SECRET = os.getenv(
    "GOALX_SESSION_SECRET",
    os.getenv("GOALX_ADMIN_SESSION_SECRET", ""),
).strip()
AUTH_COOKIE_NAME = "goalx_session"
AUTH_SESSION_SECONDS = int(
    os.getenv(
        "GOALX_SESSION_SECONDS",
        os.getenv("GOALX_ADMIN_SESSION_SECONDS", "43200"),
    )
)
AUTH_COOKIE_SECURE = os.getenv(
    "GOALX_COOKIE_SECURE",
    os.getenv(
        "GOALX_ADMIN_COOKIE_SECURE",
        "true" if os.getenv("RAILWAY_ENVIRONMENT") else "false",
    ),
).strip().lower() in {"1", "true", "yes", "on"}


# DATASET SYNC INTERVAL
DATASET_SYNC_SECONDS = int(
    os.getenv(
        "MATCHLAB_DATASET_SYNC_SECONDS",
        "600",
    )
)


class LiveAIRequest(BaseModel):
    question: str = ""


## Modelo Petición
class PrediccionRequest(BaseModel):
    """Modelo Petición"""

    competition: str = DEFAULT_COMPETITION_ID
    local: str
    visitante: str
    arbitro: str


class ResolveLiveRequest(BaseModel):
    competition: str = DEFAULT_COMPETITION_ID
    event_id: str | None = None
    date: str
    home: str
    away: str


class AuthLoginRequest(BaseModel):
    user: str = ""
    password: str = ""


class StreamSourceRequest(BaseModel):
    id: str | None = None
    name: str = ""
    type: str = "iframe"
    url: str = ""


class AdminStreamRequest(BaseModel):
    competition: str = DEFAULT_COMPETITION_ID
    id: str | None = None
    sportsdb_event_id: str | None = None
    fixture_id: int | None = None
    date: str = ""
    time: str | None = None
    home: str = ""
    away: str = ""
    title: str | None = None
    enabled: bool = True
    sources: list[StreamSourceRequest] = Field(default_factory=list)


def _runtime_or_http(competition_id=None):
    try:
        return COMPETITION_MANAGER.get_runtime(competition_id)
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error


def _streams_context(competition_id=None):
    runtime = _runtime_or_http(competition_id)
    competition = runtime.competition

    seed_path = SERVER_DIR / competition["seed_streams_filename"]

    configured_path = ""

    if competition["id"] == DEFAULT_COMPETITION_ID:
        configured_path = os.getenv("GOALX_STREAMS_PATH", "").strip()

    if configured_path:
        streams_path = Path(configured_path)
    else:
        streams_path = (
            runtime.history_service.history_path.parent
            / competition["streams_filename"]
        )

    with STREAMS_LOCKS_GUARD:
        lock = STREAMS_LOCKS.setdefault(
            competition["id"],
            threading.RLock(),
        )

    return runtime, seed_path, streams_path, lock


def _initialize_streams_storage(competition_id=None):
    _, seed_path, streams_path, lock = _streams_context(competition_id)

    with lock:
        streams_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if streams_path.exists():
            return

        if seed_path.exists() and streams_path.resolve() != seed_path.resolve():
            shutil.copy2(
                seed_path,
                streams_path,
            )
            return

        with open(
            streams_path,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                {
                    "version": 1,
                    "streams": [],
                },
                file,
                ensure_ascii=False,
                indent=2,
            )


def _read_streams_payload(competition_id=None):
    _, _, streams_path, _ = _streams_context(competition_id)
    _initialize_streams_storage(competition_id)

    try:
        with open(
            streams_path,
            "r",
            encoding="utf-8",
        ) as file:
            payload = json.load(file)
    except Exception as error:
        raise RuntimeError("No fue posible leer match_streams.json.") from error

    streams = payload.get("streams") or []

    if not isinstance(streams, list):
        streams = []

    return {
        "version": 1,
        "streams": streams,
    }


def _read_streams(competition_id=None):
    _, _, _, lock = _streams_context(competition_id)

    with lock:
        return _read_streams_payload(competition_id)["streams"]


def _write_streams(
    streams,
    competition_id=None,
):
    _, _, streams_path, lock = _streams_context(competition_id)

    with lock:
        _initialize_streams_storage(competition_id)

        temp_path = streams_path.with_suffix(".json.tmp")

        with open(
            temp_path,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                {
                    "version": 1,
                    "streams": streams,
                },
                file,
                ensure_ascii=False,
                indent=2,
            )

        os.replace(
            temp_path,
            streams_path,
        )


def _valid_stream_sources(stream):
    sources = []

    for source in stream.get("sources") or []:
        if not isinstance(source, dict):
            continue

        url = str(source.get("url") or "").strip()
        source_type = str(source.get("type") or "iframe").strip().lower()

        if source_type != "iframe":
            continue

        if not url.startswith(("https://", "http://")):
            continue

        sources.append(
            {
                "id": str(source.get("id") or len(sources) + 1),
                "name": str(source.get("name") or f"Fuente {len(sources) + 1}"),
                "type": "iframe",
                "url": url,
            }
        )

    return sources


def _auth_is_configured():
    return bool(
        AUTH_ADMIN_USER
        and (AUTH_ADMIN_PASSWORD or AUTH_ADMIN_PASSWORD_HASH)
        and AUTH_SESSION_SECRET
    )


def _decode_urlsafe(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _verify_admin_password(password):
    received_password = str(password or "")

    if AUTH_ADMIN_PASSWORD_HASH:
        try:
            algorithm, iterations, salt_value, hash_value = (
                AUTH_ADMIN_PASSWORD_HASH.split("$", 3)
            )

            if algorithm != "pbkdf2_sha256":
                return False

            iterations = int(iterations)
            salt = _decode_urlsafe(salt_value)
            expected = _decode_urlsafe(hash_value)
            received = hashlib.pbkdf2_hmac(
                "sha256",
                received_password.encode("utf-8"),
                salt,
                iterations,
            )

            return hmac.compare_digest(received, expected)
        except Exception:
            return False

    return hmac.compare_digest(
        received_password.encode("utf-8"),
        AUTH_ADMIN_PASSWORD.encode("utf-8"),
    )


def _create_auth_session(user, role):
    expires = int(time.time()) + AUTH_SESSION_SECONDS
    payload_data = json.dumps(
        {
            "user": user,
            "role": role,
            "exp": expires,
        },
        separators=(",", ":"),
    ).encode("utf-8")

    payload = base64.urlsafe_b64encode(payload_data).decode("ascii").rstrip("=")
    signature = hmac.new(
        AUTH_SESSION_SECRET.encode("utf-8"),
        payload.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()

    return f"{payload}.{signature}"


def _read_auth_session(request):
    if not _auth_is_configured():
        return None

    token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token or "." not in token:
        return None

    try:
        payload, signature = token.rsplit(".", 1)
        expected_signature = hmac.new(
            AUTH_SESSION_SECRET.encode("utf-8"),
            payload.encode("ascii"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            return None

        session = json.loads(_decode_urlsafe(payload).decode("utf-8"))

        if int(session.get("exp") or 0) <= int(time.time()):
            return None

        return session
    except Exception:
        return None


def _require_admin(request):
    session = _read_auth_session(request)

    if not session or session.get("role") != "ADMIN":
        raise HTTPException(
            status_code=401,
            detail="No autorizado.",
        )

    return session


def _stream_to_dict(request_stream, stream_id=None):
    home = str(request_stream.home or "").strip()
    away = str(request_stream.away or "").strip()
    date = str(request_stream.date or "").strip()

    if not home or not away or not date:
        raise HTTPException(
            status_code=400,
            detail="Fecha, equipo local y visitante son obligatorios.",
        )

    sources = []

    for index, source in enumerate(request_stream.sources or [], start=1):
        url = str(source.url or "").strip()
        source_type = str(source.type or "iframe").strip().lower()

        if source_type != "iframe":
            raise HTTPException(
                status_code=400,
                detail="Por ahora solo se permiten fuentes tipo iframe.",
            )

        if not url.startswith(("https://", "http://")):
            raise HTTPException(
                status_code=400,
                detail=f"La URL de Fuente {index} no es válida.",
            )

        sources.append(
            {
                "id": str(source.id or f"fuente-{index}").strip(),
                "name": str(source.name or f"Fuente {index}").strip(),
                "type": "iframe",
                "url": url,
            }
        )

    if not sources:
        raise HTTPException(
            status_code=400,
            detail="Agrega al menos una fuente de transmisión.",
        )

    final_id = str(stream_id or request_stream.id or "").strip()

    if not final_id:
        final_id = f"stream-{uuid.uuid4().hex[:12]}"

    return {
        "competition": str(request_stream.competition or DEFAULT_COMPETITION_ID)
        .strip()
        .lower(),
        "id": final_id,
        "sportsdb_event_id": (
            str(request_stream.sportsdb_event_id or "").strip() or None
        ),
        "fixture_id": request_stream.fixture_id,
        "date": date,
        "time": str(request_stream.time or "").strip() or None,
        "home": home,
        "away": away,
        "title": str(request_stream.title or f"{home} vs {away}").strip(),
        "enabled": bool(request_stream.enabled),
        "sources": sources,
    }


_initialize_streams_storage()


def convertir_json(valor):
    """Convierte recursivamente tipos de Numpy y contenedores a formatos compatibles con JSON"""

    if isinstance(valor, dict):
        return {key: convertir_json(value) for key, value in valor.items()}

    if isinstance(valor, (list, tuple)):
        return [convertir_json(item) for item in valor]

    if isinstance(valor, np.ndarray):
        return valor.tolist()

    if isinstance(valor, np.integer):
        return int(valor)

    if isinstance(valor, np.floating):
        return None if np.isnan(valor) else float(valor)

    return valor


def inicializar_modelos(competition_id=DEFAULT_COMPETITION_ID):
    return COMPETITION_MANAGER.initialize_models(competition_id)


def ensure_models_fresh(competition_id=DEFAULT_COMPETITION_ID):
    return COMPETITION_MANAGER.ensure_models_fresh(competition_id)


# DATASET BACKGROUND WORKER
async def dataset_sync_worker():

    await asyncio.sleep(30)

    while True:

        try:
            for runtime in COMPETITION_MANAGER.runtimes_for_dataset_sync():
                try:
                    result = await asyncio.to_thread(
                        runtime.dataset_sync_service.sync_today
                    )

                    if result.get("saved_count", 0) > 0:
                        print(
                            "📊 DATASET",
                            runtime.competition["name"],
                            "- nuevos partidos:",
                            result["saved_count"],
                        )

                except Exception as error:
                    print(
                        "⚠️ Dataset Sync",
                        runtime.competition["name"],
                        error,
                    )
                    traceback.print_exc()

        except Exception as error:
            print("⚠️ Dataset Sync:", error)
            traceback.print_exc()

        await asyncio.sleep(DATASET_SYNC_SECONDS)


## Lifespan FastAPI
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan FastAPI"""

    COMPETITION_MANAGER.preload_default()

    # SINCRONIZAR SET DE DATOS
    dataset_task = asyncio.create_task(dataset_sync_worker())

    try:

        yield

    finally:

        dataset_task.cancel()

        with suppress(asyncio.CancelledError):
            await dataset_task


## FastAPI
app = FastAPI(
    title="GoalX API",
    version="2.0.0",
    lifespan=lifespan,
)

## CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=(r"http://(localhost|127\.0\.0\.1):\d+"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


## Health
@app.get("/api/health")
def health():
    runtime = _runtime_or_http(DEFAULT_COMPETITION_ID)
    state = runtime.state

    return {
        "success": True,
        "status": "READY",
        "default_competition": DEFAULT_COMPETITION_ID,
        "competitions": len(list_competitions()),
        "partidos": (len(state["df"]) if state["df"] is not None else 0),
        "equipos": len(state["equipos"]),
        "arbitros": len(state["arbitros"]),
    }


@app.get("/api/competitions")
def obtener_competiciones():
    return {
        "success": True,
        "default": DEFAULT_COMPETITION_ID,
        "competitions": list_competitions(),
    }


## Catálogos
@app.get("/api/catalogos")
def obtener_catalogos(
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)
    ensure_models_fresh(runtime.competition["id"])
    state = runtime.state

    return {
        "success": True,
        "competition": runtime.competition,
        "equipos": state["equipos"],
        "arbitros": state["arbitros"],
        "model": {
            "ready": bool(state.get("model_ready")),
            "records": int(state.get("dataset_records") or 0),
            "minimum_records": int(state.get("model_min_matches") or 0),
            "message": state.get("model_message"),
        },
        "totales": {
            "equipos": len(state["equipos"]),
            "arbitros": len(state["arbitros"]),
        },
    }


## Predicción
@app.post("/api/prediccion")
def calcular_prediccion(request: PrediccionRequest):
    runtime = _runtime_or_http(request.competition)
    ensure_models_fresh(runtime.competition["id"])
    state = runtime.state

    if not state.get("model_ready"):
        raise HTTPException(
            status_code=409,
            detail=(
                state.get("model_message")
                or f"El motor de {runtime.competition['name']} todavía no está listo."
            ),
        )

    local = runtime.history_service.normalize_team_name(request.local)
    visitante = runtime.history_service.normalize_team_name(request.visitante)
    arbitro = request.arbitro.strip()

    if not local:
        raise HTTPException(
            status_code=400,
            detail="El equipo local es obligatorio.",
        )

    if not visitante:
        raise HTTPException(
            status_code=400,
            detail="El equipo visitante es obligatorio.",
        )

    if not arbitro:
        raise HTTPException(
            status_code=400,
            detail="El árbitro es obligatorio.",
        )

    if local.casefold() == visitante.casefold():
        raise HTTPException(
            status_code=400,
            detail=("El equipo local y visitante " "no pueden ser iguales."),
        )

    equipos_validos = {equipo.casefold() for equipo in state["equipos"]}

    if local.casefold() not in equipos_validos:
        raise HTTPException(
            status_code=400,
            detail=(f"El equipo local '{local}' " "no existe en el histórico."),
        )

    if visitante.casefold() not in equipos_validos:
        raise HTTPException(
            status_code=400,
            detail=(f"El equipo visitante '{visitante}' " "no existe en el histórico."),
        )

    try:
        df = state["df"]
        dc_model = state["dc_model"]
        spec_model = state["spec_model"]

        h2h = analizar_h2h(
            df,
            local,
            visitante,
        )

        goles = dc_model.predict_match(
            local,
            visitante,
        )

        corners = spec_model.predict_corners(
            local,
            visitante,
        )

        cards = spec_model.predict_cards(
            local,
            visitante,
            referee=arbitro,
        )

        # INTEGRACION DE XGBOOST
        xgb_model = state.get("xgb_tarjetas")
        xgb_clasificador = state.get("xgb_tarjetas_clasificador")
        xgb_marcadores = state.get("xgb_marcadores")
        le_marcadores = state.get("le_marcadores")

        if xgb_model or xgb_clasificador or xgb_marcadores:
            df_features = preparar_features_al_vuelo(df)
            try:
                home_stats = df_features[df_features["home_team"] == local].iloc[-1]
                away_stats = df_features[df_features["away_team"] == visitante].iloc[-1]

                X_pred = pd.DataFrame(
                    [
                        {
                            "home_avg_gf_5": home_stats["home_avg_gf_5"],
                            "home_avg_gc_5": home_stats["home_avg_gc_5"],
                            "home_avg_tarjetas_5": home_stats["home_avg_tarjetas_5"],
                            "away_avg_gf_5": away_stats["away_avg_gf_5"],
                            "away_avg_gc_5": away_stats["away_avg_gc_5"],
                            "away_avg_tarjetas_5": away_stats["away_avg_tarjetas_5"],
                        }
                    ]
                )

                # Prediccion Tarjetas
                if xgb_model:
                    cards["xgboost_expected_total"] = float(
                        xgb_model.predict(X_pred)[0]
                    )

                if xgb_clasificador:
                    probabilidades = xgb_clasificador.predict_proba(X_pred)[0]
                    cards["xgboost_under_4_5"] = float(probabilidades[0])
                    cards["xgboost_over_4_5"] = float(probabilidades[1])

                # Prediccion Marcadores
                if xgb_marcadores and le_marcadores:
                    probs_marcadores = xgb_marcadores.predict_proba(X_pred)[0]

                    # Ordenamos de menor a mayor. Lo invertimos y tomamos los primeros 5
                    top_5_indices = np.argsort(probs_marcadores)[::-1][:5]

                    top_scores_ai = {}
                    for idx in top_5_indices:
                        # Convierte el indice a texto
                        marcador_str = le_marcadores.inverse_transform([idx])[0]
                        top_scores_ai[marcador_str] = float(probs_marcadores[idx])

                    # Diccionario general de goles para mandarlo al frontend
                    goles["Top_Scores_AI"] = top_scores_ai

            except IndexError:
                cards["xgboost_expected_total"] = None
                cards["xgboost_under_4_5"] = None
                cards["xgboost_over_4_5"] = None

        resultado = {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            "partido": {
                "local": local,
                "visitante": visitante,
                "arbitro": arbitro,
            },
            "modelo": {
                "local": local,
                "visitante": visitante,
            },
            "h2h": {
                "resumen": h2h,
            },
            "goles": goles,
            "corners": corners,
            "tarjetas": cards,
        }

        return convertir_json(resultado)

    except Exception as error:
        print("❌ ERROR DE PREDICCIÓN:")
        print(error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.get("/api/live")
def obtener_partidos_live(
    scope: str = Query(
        default="today",
        pattern="^(live|today|upcoming|next)$",
    ),
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)

    try:
        result = runtime.live_service.get_matches(scope=scope)

        return {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            "scope": scope,
            **result,
        }

    except Exception as error:
        print("ERROR LIVE CENTER:", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.get("/api/live/quota/status")
def obtener_live_quota():
    return {
        "success": True,
        "quota": get_quota_status(),
    }


@app.post("/api/live/resolve")
def resolver_live_match(
    request: ResolveLiveRequest,
):
    runtime = _runtime_or_http(request.competition)

    try:
        result = runtime.live_service.resolve_match(
            date=request.date,
            home=request.home,
            away=request.away,
        )

        return {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            **result,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.get("/api/live/{fixture_id}")
def obtener_detalle_live(
    fixture_id: int,
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)
    ensure_models_fresh(runtime.competition["id"])

    try:
        detail = runtime.live_service.get_fixture_detail(fixture_id)
        history_sync = runtime.history_service.save_finished_match(detail)

        intelligence = build_live_intelligence(
            detail,
            runtime.state,
        )

        return {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            "provider": "api-football",
            "data": {
                **detail,
                "intelligence": intelligence,
            },
            "history_sync": history_sync,
        }

    except Exception as error:
        print("ERROR LIVE DETAIL:", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.post("/api/live/{fixture_id}/ai")
def consultar_live_ai(
    fixture_id: int,
    request: LiveAIRequest,
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)
    ensure_models_fresh(runtime.competition["id"])

    try:
        detail = runtime.live_service.get_fixture_detail(fixture_id)

        intelligence = build_live_intelligence(
            detail,
            runtime.state,
        )

        response = answer_live_question(
            detail,
            intelligence,
            request.question,
            competition_name=runtime.competition["name"],
        )

        return {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            **response,
        }

    except Exception as error:
        print("ERROR LIVE AI:", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


# Iniciar sesión
@app.post("/api/auth/login")
@app.post("/api/admin/login", include_in_schema=False)
def iniciar_sesion(
    request: AuthLoginRequest,
    response: Response,
):
    if not _auth_is_configured():
        raise HTTPException(
            status_code=503,
            detail="El acceso de GoalX no está configurado.",
        )

    valid_user = hmac.compare_digest(
        str(request.user or "").strip().encode("utf-8"),
        AUTH_ADMIN_USER.encode("utf-8"),
    )

    if not valid_user or not _verify_admin_password(request.password):
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos.",
        )

    token = _create_auth_session(
        AUTH_ADMIN_USER,
        "ADMIN",
    )

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=AUTH_SESSION_SECONDS,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )

    return {
        "success": True,
        "authenticated": True,
        "user": {
            "username": AUTH_ADMIN_USER,
            "role": "ADMIN",
        },
    }


# Validar sesión
@app.get("/api/auth/session")
@app.get("/api/admin/session", include_in_schema=False)
def obtener_sesion(request: Request):
    session = _read_auth_session(request)

    if not session:
        return {
            "success": True,
            "authenticated": False,
            "user": None,
        }

    return {
        "success": True,
        "authenticated": True,
        "user": {
            "username": session.get("user"),
            "role": session.get("role"),
        },
    }


# Cerrar sesión
@app.post("/api/auth/logout")
@app.post("/api/admin/logout", include_in_schema=False)
def cerrar_sesion(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=AUTH_COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )

    return {
        "success": True,
    }


# Obtener configuraciones completas del administrador
@app.get("/api/admin/streams")
def obtener_transmisiones_admin(
    request: Request,
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    _require_admin(request)
    runtime = _runtime_or_http(competition)

    return {
        "success": True,
        "competition": {
            "id": runtime.competition["id"],
            "name": runtime.competition["name"],
        },
        "streams": _read_streams(runtime.competition["id"]),
    }


@app.post("/api/admin/streams")
def crear_transmision_admin(
    request_stream: AdminStreamRequest,
    request: Request,
):
    _require_admin(request)
    runtime = _runtime_or_http(request_stream.competition)
    competition_id = runtime.competition["id"]
    _, _, _, lock = _streams_context(competition_id)

    with lock:
        streams = _read_streams_payload(competition_id)["streams"]

        sportsdb_event_id = str(request_stream.sportsdb_event_id or "").strip()
        fixture_id = request_stream.fixture_id
        date = str(request_stream.date or "").strip()
        home = str(request_stream.home or "").strip().casefold()
        away = str(request_stream.away or "").strip().casefold()

        for stream in streams:
            if (
                sportsdb_event_id
                and str(stream.get("sportsdb_event_id") or "").strip()
                == sportsdb_event_id
            ):
                raise HTTPException(
                    status_code=409,
                    detail=("Este partido ya tiene una " "transmisión configurada."),
                )

            if fixture_id and str(stream.get("fixture_id") or "") == str(fixture_id):
                raise HTTPException(
                    status_code=409,
                    detail=("Este partido ya tiene una " "transmisión configurada."),
                )

            if (
                date
                and str(stream.get("date") or "").strip() == date
                and str(stream.get("home") or "").strip().casefold() == home
                and str(stream.get("away") or "").strip().casefold() == away
            ):
                raise HTTPException(
                    status_code=409,
                    detail=("Este partido ya tiene una " "transmisión configurada."),
                )

        new_stream = _stream_to_dict(request_stream)
        new_stream["competition"] = competition_id
        streams.append(new_stream)
        _write_streams(
            streams,
            competition_id,
        )

    return {
        "success": True,
        "stream": new_stream,
    }


@app.put("/api/admin/streams/{stream_id}")
def actualizar_transmision_admin(
    stream_id: str,
    request_stream: AdminStreamRequest,
    request: Request,
):
    _require_admin(request)
    runtime = _runtime_or_http(request_stream.competition)
    competition_id = runtime.competition["id"]
    _, _, _, lock = _streams_context(competition_id)

    with lock:
        streams = _read_streams_payload(competition_id)["streams"]
        updated_stream = _stream_to_dict(
            request_stream,
            stream_id=stream_id,
        )
        updated_stream["competition"] = competition_id

        for index, stream in enumerate(streams):
            if str(stream.get("id") or "").strip() != stream_id:
                continue

            streams[index] = updated_stream
            _write_streams(
                streams,
                competition_id,
            )

            return {
                "success": True,
                "stream": updated_stream,
            }

    raise HTTPException(
        status_code=404,
        detail="La transmisión no existe.",
    )


@app.delete("/api/admin/streams/{stream_id}")
def eliminar_transmision_admin(
    stream_id: str,
    request: Request,
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    _require_admin(request)
    runtime = _runtime_or_http(competition)
    competition_id = runtime.competition["id"]
    _, _, _, lock = _streams_context(competition_id)

    with lock:
        streams = _read_streams_payload(competition_id)["streams"]
        next_streams = [
            stream
            for stream in streams
            if str(stream.get("id") or "").strip() != stream_id
        ]

        if len(next_streams) == len(streams):
            raise HTTPException(
                status_code=404,
                detail="La transmisión no existe.",
            )

        _write_streams(
            next_streams,
            competition_id,
        )

    return {
        "success": True,
    }


@app.get("/api/streams")
def obtener_transmisiones(
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)
    competition_id = runtime.competition["id"]
    streams = []

    for stream in _read_streams(competition_id):
        if not isinstance(stream, dict) or not stream.get("enabled", True):
            continue

        sources = _valid_stream_sources(stream)

        if not sources:
            continue

        stream_id = str(stream.get("id") or "").strip()

        if not stream_id:
            continue

        streams.append(
            {
                "competition": competition_id,
                "id": stream_id,
                "sportsdb_event_id": (
                    str(stream.get("sportsdb_event_id") or "").strip() or None
                ),
                "fixture_id": stream.get("fixture_id"),
                "date": stream.get("date"),
                "time": stream.get("time"),
                "home": stream.get("home"),
                "away": stream.get("away"),
                "title": stream.get("title"),
                "source_count": len(sources),
            }
        )

    return {
        "success": True,
        "competition": {
            "id": runtime.competition["id"],
            "name": runtime.competition["name"],
        },
        "streams": streams,
        "count": len(streams),
    }


@app.get("/api/streams/{stream_id}")
def obtener_transmision(
    stream_id: str,
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)
    competition_id = runtime.competition["id"]
    stream_id = str(stream_id or "").strip()

    for stream in _read_streams(competition_id):
        if not isinstance(stream, dict):
            continue

        if str(stream.get("id") or "").strip() != stream_id:
            continue

        if not stream.get("enabled", True):
            break

        sources = _valid_stream_sources(stream)

        if not sources:
            break

        return {
            "success": True,
            "competition": {
                "id": runtime.competition["id"],
                "name": runtime.competition["name"],
            },
            "stream": {
                "competition": competition_id,
                "id": stream_id,
                "sportsdb_event_id": (
                    str(stream.get("sportsdb_event_id") or "").strip() or None
                ),
                "fixture_id": stream.get("fixture_id"),
                "date": stream.get("date"),
                "time": stream.get("time"),
                "home": stream.get("home"),
                "away": stream.get("away"),
                "title": stream.get("title"),
                "sources": sources,
            },
        }

    raise HTTPException(
        status_code=404,
        detail="La transmisión no está disponible.",
    )


@app.get("/api/dataset/status")
def obtener_dataset_status(
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)

    try:
        return {
            "success": True,
            "dataset": runtime.history_service.get_status(),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


@app.post("/api/dataset/sync")
def sincronizar_dataset(
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)

    try:
        result = runtime.dataset_sync_service.sync_today(force=True)

        return {
            "success": True,
            "result": result,
            "dataset": runtime.history_service.get_status(),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


DATASET_SYNC_TOKEN = os.getenv(
    "MATCHLAB_DATASET_SYNC_TOKEN",
    "",
)


@app.get("/api/dataset/export")
def exportar_dataset(
    x_matchlab_token: str | None = Header(default=None),
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    if not DATASET_SYNC_TOKEN or x_matchlab_token != DATASET_SYNC_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="No autorizado.",
        )

    runtime = _runtime_or_http(competition)
    history_path = runtime.history_service.history_path

    if not history_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No existe el histórico.",
        )

    return FileResponse(
        path=str(history_path),
        media_type="text/csv",
        filename=runtime.competition["seed_history_filename"],
    )


# Este endpoint lo usamos para sincronizar season_highlights.json de railway en github
@app.get("/api/highlights/export")
def exportar_highlights(
    x_matchlab_token: str | None = Header(default=None),
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    if not DATASET_SYNC_TOKEN or x_matchlab_token != DATASET_SYNC_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="No autorizado.",
        )

    runtime = _runtime_or_http(competition)
    highlights_path = runtime.history_service.highlights_path

    if not highlights_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No existe el histórico de destacados.",
        )

    return FileResponse(
        path=str(highlights_path),
        media_type="application/json",
        filename=runtime.competition["seed_highlights_filename"],
    )


@app.get("/api/highlights")
def obtener_destacados_temporada(
    competition: str = Query(default=DEFAULT_COMPETITION_ID),
):
    runtime = _runtime_or_http(competition)

    try:
        data = runtime.history_service.get_season_highlights()

        return {
            "success": True,
            **data,
        }

    except Exception as error:
        print("ERROR SEASON HIGHLIGHTS:", error)
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error


## FrontEnd React
if FRONTEND_DIR is not None:
    print(f"🌐 Frontend encontrado: {FRONTEND_DIR}")

    assets_dir = FRONTEND_DIR / "assets"

    if assets_dir.exists():
        app.mount(
            "/assets",
            StaticFiles(directory=str(assets_dir)),
            name="frontend-assets",
        )

    # archivo ads.txt - para adsense
    @app.get("/ads.txt", include_in_schema=False)
    async def ads_txt():
        ads_file = FRONTEND_DIR / "ads.txt"

        return FileResponse(
            path=str(ads_file),
            media_type="text/plain",
        )

    # react spa fallback
    @app.get("/{full_path:path}", include_in_schema=False)
    async def frontend_spa(full_path: str):
        requested_file = FRONTEND_DIR / full_path

        if full_path and requested_file.is_file():
            return FileResponse(
                path=str(requested_file),
            )

        return FileResponse(
            path=str(FRONTEND_DIR / "index.html"),
            media_type="text/html",
        )

else:
    print("ℹ️ Frontend compilado no encontrado.")
