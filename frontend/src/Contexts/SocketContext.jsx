// frontend/src/Contexts/SocketContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { createSocket } from "../socket";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = createSocket();
    if (!s) return;

    setSocket(s);

    s.on("connect", () => console.log("Socket Connected:", s.id));
    s.on("connect_error", (err) =>
      console.error("Socket Error:", err?.message || err)
    );

    return () => {
      try {
        s.disconnect();
      } catch {}
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
