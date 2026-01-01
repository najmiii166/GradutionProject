// frontend/src/Contexts/SocketContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../socket";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const s = createSocket();
    if (!s) return;

    setSocket(s);

    s.on("connect", () => console.log("Socket Connected:", s.id));
    s.on("connect_error", (err) =>
      console.error("Socket Error:", err?.message || err)
    );

    // When a new conversation is created involving this user, open it
    s.on("conversation:created", (convo) => {
      try {
        if (convo && convo._id) {
          navigate(`/chat/${convo._id}`);
        }
      } catch (e) {
        console.error("conversation:created handler error:", e);
      }
    });

    // Generic notifications (requests, chat, accept/reject, etc.)
    s.on("notification", (payload) => {
      try {
        // Dispatch a DOM event so pages can subscribe without coupling to socket
        window.dispatchEvent(new CustomEvent("socket:notification", { detail: payload }));
      } catch (e) {
        console.error("Failed to dispatch socket:notification event:", e);
      }
    });

    return () => {
      try {
        s.disconnect();
      } catch {}
      setSocket(null);
    };
  }, [navigate]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
