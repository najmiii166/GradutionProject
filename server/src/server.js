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
import reportsRoutes from "./routes/reports.routes.js";
import supportRoutes from "./routes/support.routes.js";
import adminTicketsRoutes from "./routes/admin.tickets.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";

import path from "path";
import { fileURLToPath } from "url";

import http from "http";
import { Server } from "socket.io";
import socketAuth from "./middleware/socketAuth.js";
import { ensureAdminExists } from "./seed/seedAdmin.js";
import Message from "./models/Message.js";

import httpProxy from "http-proxy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =====================================================
   CORS FIX — ADD VERCEL DOMAINS
===================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://gradution-project-git-main-najmiii166s-projects.vercel.app",
  "https://gradution-project-jixjwsqsm-najmiii166s-projects.vercel.app",
  "https://gradution-project-eight.vercel.app",
];

console.log("Allowed Origins =>", allowedOrigins);

/* =====================================================
   ENVIRONMENT VALIDATION
   - Log whether OPENAI_API_KEY is loaded
   - In production, fail fast if missing to avoid silent errors
===================================================== */
const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
if (hasOpenAiKey) {
  console.log("✅ OPENAI_API_KEY loaded (will be used for report generation)");
} else {
  console.error("⚠️ OPENAI_API_KEY is NOT set. AI report generation will fail if attempted.");
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: OPENAI_API_KEY is required in production. Exiting.");
    process.exit(1);
  }
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

/* =====================================================
   STATIC FILES
===================================================== */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* =====================================================
   ROUTES
===================================================== */
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/support", supportRoutes);
// mount admin tickets alongside existing admin router so path becomes /api/admin/tickets
app.use("/api/admin", adminTicketsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);

app.get("/", (_, res) => res.send("MentorLink API Running"));

/* =====================================================
   SOCKET.IO SERVER
===================================================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
// Expose io on the express app so routes can emit events: req.app.get('io')
app.set("io", io);
io.use(socketAuth);

/* =====================================================
   SOCKET LOGIC
===================================================== */
io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  const userId = socket.user?._id;
  if (userId) socket.join(userId);

  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(conversationId);
  });

  socket.on("message:edit", async ({ messageId, text }) => {
    if (!messageId || !text) return;

    const msg = await Message.findById(messageId);
    if (!msg) return;
    if (String(msg.sender) !== String(socket.user.id)) return;

    msg.text = text;
    msg.edited = true;
    await msg.save();

    io.to(msg.conversation.toString()).emit("message:updated", msg);
  });

  socket.on("message:delete", async ({ messageId }) => {
    if (!messageId) return;
    const msg = await Message.findById(messageId);
    if (!msg) return;

    msg.deleted = true;
    msg.text = "";
    await msg.save();

    io.to(msg.conversation.toString()).emit("message:deleted", {
      _id: msg._id,
      conversationId: msg.conversation,
    });
  });

  /* -------------------------
       CALL LOGIC
  -------------------------- */
  socket.on("call:offer", (data) => {
    io.to(data.targetId).emit("call:incoming", data);
  });

  socket.on("call:answer", (data) => {
    io.to(data.targetId).emit("call:answer", data);
  });

  socket.on("call:ice-candidate", (data) => {
    io.to(data.targetId).emit("call:ice-candidate", data);
  });

  socket.on("call:reject", (data) => {
    io.to(data.targetId).emit("call:rejected");
  });

  socket.on("call:end", (data) => {
    io.to(data.targetId).emit("call:ended");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

/* =====================================================
   VITE DEV PROXY (LOCAL ONLY)
===================================================== */
const viteProxy = httpProxy.createProxyServer({
  target: "http://localhost:5174",
  ws: true,
  changeOrigin: true,
});

// Proxy Vite only during local dev
app.use((req, res, next) => {
  const url = req.url || "";
  if (url.startsWith("/api") || url.startsWith("/uploads") || url.startsWith("/socket.io"))
    return next();

  viteProxy.web(req, res, (err) => {
    console.error("Proxy Error:", err?.message);
    res.status(502).end("Proxy Failed");
  });
});

/* =====================================================
   START SERVER
===================================================== */
const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    ensureAdminExists(); // <-- Check for and create admin user if needed
    server.listen(port, () =>
      console.log(`🚀 Server Ready → http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });
