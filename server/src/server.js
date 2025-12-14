// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";
import requestRoutes from "./routes/request.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.routes.js";

import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import socketAuth from "./middleware/socketAuth.js";
import httpProxy from "http-proxy";
import { URL } from "url";

import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS ORIGINS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = [
  FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
];

console.log("Allowed CORS origins:", allowedOrigins);

// MIDDLEWARE
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// STATIC FILES
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ROUTES
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (_, res) => res.send("MentorLink API"));

// HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.use(socketAuth);

// --------------------------------------------
// ✅ ALL SOCKET LOGIC HERE — CLEAN + WORKING
// --------------------------------------------
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // PRIVATE ROOM FOR CALLS
  const userId = socket.user?._id;
  if (userId) socket.join(userId);

  // ------------------------------
  // JOIN / LEAVE CHAT ROOM
  // ------------------------------
  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(conversationId);
  });

  socket.on("leave_conversation", ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // ------------------------------
  // MESSAGE EDIT
  // ------------------------------
  socket.on("message:edit", async ({ messageId, text }) => {
    try {
      if (!messageId || typeof text !== "string") return;

      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (String(msg.sender) !== String(socket.user.id)) return;

      msg.text = text;
      msg.edited = true;
      await msg.save();

      const updated = await msg.populate("sender", "fullName _id");

      io.to(msg.conversation.toString()).emit("message:updated", updated.toObject());
    } catch (err) {
      console.error("message:edit error:", err);
    }
  });

  // ------------------------------
  // MESSAGE DELETE
  // ------------------------------
  socket.on("message:delete", async ({ messageId }) => {
    try {
      if (!messageId) return;

      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (String(msg.sender) !== String(socket.user.id)) return;

      msg.deleted = true;
      msg.text = "";
      await msg.save();

      io.to(msg.conversation.toString()).emit("message:deleted", {
        _id: msg._id,
        conversationId: msg.conversation,
      });
    } catch (err) {
      console.error("message:delete error:", err);
    }
  });

// ------------------------------
// CALL SIGNALING
// ------------------------------
socket.on("call:offer", (data) => {
  // Notify callee of incoming call
  io.to(data.targetId).emit("call:incoming", {
    fromId: data.fromId,
    fromName: data.fromName,
    offer: data.offer,
  });

  // Notify caller that callee is ringing
  io.to(data.fromId).emit("call:ringing");
});

socket.on("call:answer", (data) => {
  // Send answer to caller
  io.to(data.targetId).emit("call:answer", {
    answer: data.answer,
  });

  // Notify caller that call is now connected
  io.to(data.targetId).emit("call:accepted");
});

socket.on("call:ice-candidate", ({ targetId, candidate }) => {
  io.to(targetId).emit("call:ice-candidate", { candidate });
});

socket.on("call:reject", ({ targetId }) => {
  io.to(targetId).emit("call:rejected");
});

socket.on("call:end", ({ targetId }) => {
  io.to(targetId).emit("call:ended");
});

  // ------------------------------
  // DISCONNECT
  // ------------------------------
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// --------------------------------------------
// VITE PROXY FOR FRONTEND HMR
// --------------------------------------------
const viteProxy = httpProxy.createProxyServer({
  target: "http://localhost:5174",
  ws: true,
  changeOrigin: true,
});

// Proxy non-API requests to Vite
app.use((req, res, next) => {
  const url = req.url || "";
  if (url.startsWith("/api") || url.startsWith("/uploads") || url.startsWith("/socket.io"))
    return next();

  viteProxy.web(req, res, (err) => {
    console.error("Vite proxy error:", err?.message);
    res.statusCode = 502;
    res.end("Bad Gateway (Proxy)");
  });
});

// WS proxy (HMR)
server.on("upgrade", (req, socket, head) => {
  const reqUrl = new URL(req.url || "", `http://localhost`);
  if (reqUrl.pathname.startsWith("/socket.io")) return;

  viteProxy.ws(req, socket, head);
});

// --------------------------------------------
// START SERVER
// --------------------------------------------
const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(port, () =>
      console.log(`🚀 Server + Socket running on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
