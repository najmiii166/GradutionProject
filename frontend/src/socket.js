// frontend/src/socket.js
import { io } from "socket.io-client";
import { API_URL } from "./api/axios";

// Convert "http://localhost:5000/api" → "http://localhost:5000"
const SOCKET_URL = API_URL.replace(/\/api$/, "");

export function createSocket() {
  const token = localStorage.getItem("token");

  // Allow polling as a fallback transport so the client can connect even if
  // a direct websocket handshake fails (proxies, dev-proxy misconfig, etc.)
  const socket = io(SOCKET_URL, {
    // prefer websocket but allow polling fallback
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 500,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected");
  });

  socket.on("connect_error", (err) => {
    // Log full error for debugging (may include transport and server response)
    try {
      console.error("⚠️ Socket connect_error:", err);
    } catch (e) {
      console.log("⚠️ Socket connect_error (string):", String(err));
    }
  });

  // Optional: log upgrade attempts and transport changes
  socket.io.on("upgrade", (transport) => {
    console.log("Socket transport upgraded to:", transport.name);
  });

  return socket;
}
