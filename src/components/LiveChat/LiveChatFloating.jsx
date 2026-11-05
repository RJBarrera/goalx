import { useEffect, useRef, useState } from "react";
import LiveChat from "./LiveChat";
import "./LiveChatFloating.css";

export default function LiveChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef(null);

  function closeChat() {
    setIsOpen(false);
    launcherRef.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeChat();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="goalx-floating-chat">
      {isOpen && (
        <aside
          id="goalx-floating-chat-panel"
          className="goalx-floating-chat__panel"
          role="region"
          aria-label="Chat en vivo de GoalPicks"
        >
          <button
            type="button"
            className="goalx-floating-chat__close"
            aria-label="Cerrar chat"
            onClick={closeChat}
          >
            ✕
          </button>

          <LiveChat />
        </aside>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="goalx-floating-chat__launcher"
        aria-expanded={isOpen}
        aria-controls="goalx-floating-chat-panel"
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span className="goalx-floating-chat__launcher-icon" aria-hidden="true">
          💬
        </span>

        <span>{isOpen ? "Cerrar chat" : "Chat en vivo"}</span>

        {!isOpen && (
          <span
            className="goalx-floating-chat__online-dot"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
