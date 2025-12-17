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
