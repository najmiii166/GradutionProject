// frontend/src/socket.js
import { io } from "socket.io-client";
import { API_URL } from "./api/axios";

// Strip trailing /api if present
const SOCKET_URL = API_URL.replace(/\/api\/?$/i, "");

export function createSocket() {
  const token = localStorage.getItem("token");

  const socket = io(SOCKET_URL, {
    // 🔥 MUHIIM: polling FIRST, websocket SECOND
    transports: ["polling", "websocket"],

    // auth token for socketAuth middleware
    auth: token ? { token } : {},

    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("⚠️ Socket connect_error:", err.message || err);
  });

  return socket;
}
