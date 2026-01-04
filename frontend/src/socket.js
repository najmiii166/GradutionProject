// frontend/src/socket.js
import { io } from "socket.io-client";
import { API_URL } from "./api/axios";

/*
  Socket client behaviour:
  - Attempt HTTP long-polling first, then websocket upgrade.
  - When frontend and API hosts differ (Vercel frontend + Railway API), connect to the frontend origin
    so Vercel proxy rewrites `/socket.io/*` to Railway; in that case force polling-only to avoid direct wss.
  - Use `path: '/socket.io'` to match backend and proxy rewrites.
  - On websocket connect_error that looks like WS failure, retry once with polling-only.
*/

function getSocketOptions({ proxied, token }) {
  const base = {
    transports: proxied ? ["polling"] : ["polling", "websocket"],
    path: "/socket.io",
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  };
  if (token) base.auth = { token };
  return base;
}

export function createSocket() {
  const token = localStorage.getItem("token");

  // Decide whether API host differs from frontend host (i.e. proxied via Vercel)
  let proxied = false;
  try {
    const apiHost = new URL(API_URL).hostname;
    if (typeof window !== "undefined") proxied = window.location.hostname !== apiHost;
  } catch (e) {
    // ignore and assume not proxied
  }

  // If proxied, connect to same-origin (undefined URL) so the browser issues requests to frontend origin
  // which Vercel will rewrite to Railway per vercel.json. If not proxied, connect directly to API host.
  const connectUrl = proxied ? undefined : API_URL.replace(/\/api\/?$/i, "");

  const opts = getSocketOptions({ proxied, token });
  let socket = io(connectUrl, opts);

  socket.on("connect", () => console.log("🔌 Socket Connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("❌ Socket Disconnected:", reason));

  socket.on("connect_error", (err) => {
    console.error("⚠️ Socket connect_error:", err && (err.message || err));

    const msg = String(err?.message || "").toLowerCase();
    const isWsError = msg.includes("websocket") || msg.includes("ws") || msg.includes("upgrade");

    // If websocket failed and we are not already polling-only, retry with polling-only once.
    const alreadyPollingOnly = opts.transports.length === 1 && opts.transports[0] === "polling";
    if (isWsError && !alreadyPollingOnly) {
      console.warn("Socket WS failed — retrying with polling-only...");
      try {
        socket.removeAllListeners();
        socket.close();
      } catch (e) {
        /* ignore */
      }

      const fallbackOpts = { ...opts, transports: ["polling"] };
      socket = io(connectUrl, fallbackOpts);

      socket.on("connect", () => console.log("🔌 Socket (polling) Connected:", socket.id));
      socket.on("disconnect", (r) => console.log("❌ Socket (polling) Disconnected:", r));
      socket.on("connect_error", (e) => console.error("⚠️ Socket (polling) connect_error:", e && (e.message || e)));
    }
  });

  return socket;
}
