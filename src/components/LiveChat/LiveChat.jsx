import { useEffect, useRef, useState } from "react";
import { getTeamLogo } from "../../utils/teamLogos";
import "./LiveChat.css";

const NICK_KEY = "goalx_chat_nickname";

function getInitialNickname() {
  try {
    const saved = sessionStorage.getItem(NICK_KEY);
    if (saved) return saved;
  } catch {
    // Navegador sin sessionStorage disponible
  }

  return `Invitado${Math.floor(1000 + Math.random() * 9000)}`;
}

function getChatUrl(nickname) {
  const configured = import.meta.env.VITE_CHAT_WS_URL;

  const defaultUrl = import.meta.env.DEV
    ? "ws://127.0.0.1:8000/ws/chat"
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/chat`;

  const url = new URL(configured || defaultUrl);
  url.searchParams.set("nick", nickname);

  return url.toString();
}

export default function LiveChat() {
  const [nickname, setNickname] = useState(getInitialNickname);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [online, setOnline] = useState(0);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    let active = true;
    let retryTimer = null;

    function connect() {
      if (!active) return;

      setStatus("connecting");

      const socket = new WebSocket(getChatUrl(nickname));
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setStatus("online");
        setError("");
      };

      socket.onmessage = (event) => {
        if (!active) return;

        let data;

        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === "history") {
          setMessages(data.messages || []);
        }

        if (data.type === "message") {
          setMessages((previous) => {
            if (previous.some((item) => item.id === data.message.id)) {
              return previous;
            }

            return [...previous, data.message].slice(-300);
          });
        }

        if (data.type === "presence") {
          setOnline(data.online || 0);
        }

        if (data.type === "reset") {
          setMessages([]);
        }

        if (data.type === "error") {
          setError(data.message || "No se pudo enviar el mensaje.");
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (!active) return;

        setStatus("offline");
        setOnline(0);

        retryTimer = window.setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [nickname]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  function sendMessage(event) {
    event.preventDefault();

    const text = messageText.trim();
    const socket = socketRef.current;

    if (!text || socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "message",
        text,
      }),
    );

    setMessageText("");
    setError("");
  }

  function changeNickname(event) {
    event.preventDefault();

    const next = nicknameDraft
      .trim()
      .replace(/[^\p{L}\p{N} _.-]/gu, "")
      .slice(0, 20);

    if (!next) return;

    try {
      sessionStorage.setItem(NICK_KEY, next);
    } catch {
      // El apodo seguirá disponible durante esta sesión React
    }

    setNicknameDraft(next);
    setNickname(next);
  }

  return (
    <section className="goalx-chat">
      <div className="goalx-chat__header">
        <div className="sports-chat">
          <div className="sports-chat__logo">
            <img
              src={getTeamLogo("logo")}
              alt="GoalPicks"
              className="sports-select__team-logo"
            />
          </div>
          <p>Comunidad GoalPicks</p>
        </div>

        <div className="goalx-chat__status">
          <span
            className={`goalx-chat__dot ${
              status === "online" ? "is-online" : ""
            }`}
          />
          {status === "online"
            ? `${online} conectados`
            : status === "connecting"
              ? "Conectando..."
              : "Reconectando..."}
        </div>
      </div>

      <form className="goalx-chat__nickname" onSubmit={changeNickname}>
        <label htmlFor="goalx-chat-nick">Tu apodo:</label>
        <input
          id="goalx-chat-nick"
          value={nicknameDraft}
          onChange={(event) => setNicknameDraft(event.target.value)}
          maxLength={20}
        />
        <button type="submit">Guardar</button>
      </form>

      <div
        ref={messagesContainerRef}
        className="goalx-chat__messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="goalx-chat__empty">
            <span>💬</span>
            <strong>¡Inicia la conversación!</strong>
            <p>Todavía no hay mensajes en el chat de hoy.</p>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`goalx-chat__message ${
                message.nickname === nickname ? "is-own" : ""
              }`}
            >
              <div className="goalx-chat__message-meta">
                <strong>{message.nickname}</strong>
                <time>
                  {new Date(message.created_at).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              <p>{message.text}</p>
            </article>
          ))
        )}
      </div>

      {error && (
        <p className="goalx-chat__error" role="alert">
          {error}
        </p>
      )}

      <form className="goalx-chat__composer" onSubmit={sendMessage}>
        <input
          aria-label="Escribir mensaje"
          placeholder="Escribe algo sobre fútbol..."
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          maxLength={300}
          disabled={status !== "online"}
        />

        <button
          type="submit"
          disabled={status !== "online" || !messageText.trim()}
        >
          Enviar
        </button>
      </form>

      <div className="goalx-chat__footer">
        <span>Máximo 300 caracteres por mensaje</span>
        <span>El chat se reinicia diariamente a medianoche</span>
      </div>
    </section>
  );
}
