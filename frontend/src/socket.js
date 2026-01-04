// frontend/src/socket.js
import { io } from "socket.io-client";
import { API_URL } from "./api/axios";

// Determine socket URL: prefer same-origin (empty string) when the API host differs
let SOCKET_URL = API_URL.replace(/\/api\/?$/i, "");
try {
  if (typeof window !== "undefined") {
    const apiHost = new URL(API_URL).hostname;
    if (window.location.hostname !== apiHost) {
      // connect to same origin (will route through Vercel proxy)
      SOCKET_URL = "";
    }
  }
} catch (err) {
  // fallback: keep SOCKET_URL as-is
}

export function createSocket() {
  const token = localStorage.getItem("token");

  const socket = io(SOCKET_URL, {
    // If connecting via proxy (same-origin), force polling only to avoid websocket upgrades
    transports: SOCKET_URL === "" ? ["polling"] : ["polling", "websocket"],

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
