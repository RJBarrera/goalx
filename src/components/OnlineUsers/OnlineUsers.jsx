import { useEffect, useState } from "react";
import "./OnlineUsers.css";

const HEARTBEAT_INTERVAL = 30000;
const STORAGE_KEY = "goalx_presence_visitor_id";

function OnlineUsers() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let mounted = true;
    let visitorId;

    try {
      visitorId = sessionStorage.getItem(STORAGE_KEY);

      if (!visitorId) {
        visitorId = window.crypto.randomUUID();
        sessionStorage.setItem(STORAGE_KEY, visitorId);
      }
    } catch {
      visitorId = window.crypto.randomUUID();
    }

    const actualizar = async () => {
      try {
        const response = await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitor_id: visitorId,
          }),
        });

        if (!response.ok) {
          throw new Error("No se pudo consultar la presencia");
        }

        const data = await response.json();

        if (mounted) {
          setOnline(data.online);
        }
      } catch (error) {
        console.error("Error de presencia:", error);

        if (mounted) {
          setOnline(null);
        }
      }
    };

    actualizar();

    const interval = setInterval(actualizar, HEARTBEAT_INTERVAL);

    const alRegresar = () => {
      if (!document.hidden) {
        actualizar();
      }
    };

    document.addEventListener("visibilitychange", alRegresar);

    return () => {
      mounted = false;
      clearInterval(interval);

      document.removeEventListener("visibilitychange", alRegresar);
    };
  }, []);

  if (online === null) {
    return null;
  }

  return (
    <div className="goalx-online">
      <span className="goalx-online__dot" />
      <strong className="goalx-online__count">{online}</strong>
      <span className="goalx-online__label">en línea</span>
    </div>
  );
}

export default OnlineUsers;
