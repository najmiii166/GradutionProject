// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import socketAuth from "./middleware/socketAuth.js";
import { ensureAdminExists } from "./seed/seedAdmin.js";
import { finalizeSessionsJob } from "./jobs/finalizeSessions.job.js";

import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

// ROUTES
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
import sessionsRoutes from "./routes/sessions.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";
// AI routes removed
import feedbackRoutes from "./routes/feedback.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", true);

/* ===============================
   ALLOWED ORIGINS (CORS FIX)
================================ */
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://graduation-project-eight.vercel.app",
  "https://graduation-project-jade.vercel.app", // ✅ YOUR NEW LIVE VERCEL DOMAIN
  "https://gradution-project-git-main-najmiii166s-projects.vercel.app",
  "https://graduation-project-najmiii166s-projects.vercel.app",
  // allow explicit FRONTEND_URL from env if configured
  ...(FRONTEND_URL ? [FRONTEND_URL] : []),
];

// Same rule for HTTP + Socket
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Postman / server-to-server
  try {
    // Allow any localhost port in dev
    if (origin.startsWith("http://localhost:")) return true;

    if (allowedOrigins.includes(origin)) return true;
    if (origin.endsWith(".vercel.app")) return true;
    // catch other common hosting patterns
    if (origin.includes("vercel.app") || origin.includes("railway.app")) return true;
  } catch (e) {
    return false;
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // IMPORTANT: do NOT pass an Error to the callback here — that can prevent
    // CORS headers from being sent and lead to the browser reporting
    // "No 'Access-Control-Allow-Origin' header is present". Return a boolean
    // instead so the middleware can handle responses normally.
    if (isOriginAllowed(origin)) return callback(null, true);
    console.warn("Blocked CORS origin:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ IMPORTANT: preflight uses SAME options

app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

const uploadsRoot = path.join(__dirname, "..", "uploads");
app.use("/uploads/idcards", (_req, res) => {
  return res.status(403).json({ message: "Direct ID card access denied" });
});
app.use("/uploads/avatars", express.static(path.join(uploadsRoot, "avatars")));
app.use("/uploads/chat", (_req, res) => {
  return res.status(403).json({ message: "Direct chat attachment access denied" });
});

// ROUTES
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
app.use("/api/admin", adminTicketsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api", contactRoutes);

// Debug route: returns the request Origin and whether it's allowed by CORS.
// Useful for remote debugging when browser shows CORS errors.
app.get("/api/_debug/origin", (req, res) => {
  const origin = req.get("origin") || null;
  console.log("[DEBUG] Incoming Origin:", origin);
  return res.json({ origin, allowed: isOriginAllowed(origin) });
});

// HEALTH CHECK
app.get("/", (_, res) => res.send("MentorLink API Running on Railway 🚀"));

const server = http.createServer(app);
app.set("trust proxy", 1);

const io = new Server(server, {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS (socket): " + origin));
    },
    credentials: true,
  },
});

app.set("io", io);

io.use(socketAuth);

const onlineUsers = new Map(); // userId -> Set(socketId)
const typingRateLimit = new Map(); // `${userId}:${conversationId}` -> ts
const roomForConversation = (conversationId) => `convo:${conversationId}`;

async function canAccessConversation(conversationId, userId) {
  if (!conversationId || !userId) return null;
  try {
    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) return null;
    const allowed =
      String(convo.mentor) === String(userId) || String(convo.student) === String(userId);
    return allowed ? convo : null;
  } catch {
    return null;
  }
}

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  // JWT payload (see auth.js) has { id, role, status }.
  // socketAuth attaches this as socket.user, so prefer .id and
  // fall back to ._id in case tokens ever change shape.
  const userId = socket.user?._id || socket.user?.id;

  if (userId) {
    const room = userId.toString();
    socket.join(room);
    console.log("👤 Socket joined user room:", room);

    const key = String(userId);
    const set = onlineUsers.get(key) || new Set();
    set.add(socket.id);
    onlineUsers.set(key, set);

    io.emit("user_status", { userId: key, status: "online" });
  } else {
    console.warn("Socket connected without userId; no user room joined");
  }

  socket.on("user_online", () => {
    if (!userId) return;
    io.emit("user_status", { userId: String(userId), status: "online" });
  });

  socket.on("get_user_status", (targetUserId) => {
    if (!targetUserId) return;
    const isOnline = (onlineUsers.get(String(targetUserId))?.size || 0) > 0;
    socket.emit("user_status", {
      userId: String(targetUserId),
      status: isOnline ? "online" : "offline",
    });
  });

  socket.on("join_conversation", async ({ conversationId } = {}) => {
    if (!userId || !conversationId) return;
    const convo = await canAccessConversation(conversationId, userId);
    if (!convo) return;
    socket.join(roomForConversation(conversationId));
  });

  socket.on("typing", async ({ conversationId } = {}) => {
    if (!userId || !conversationId) return;
    const convo = await canAccessConversation(conversationId, userId);
    if (!convo) return;

    // Lightweight per-user+conversation typing throttling
    const rateKey = `${userId}:${conversationId}`;
    const now = Date.now();
    const prev = typingRateLimit.get(rateKey) || 0;
    if (now - prev < 800) return;
    typingRateLimit.set(rateKey, now);

    socket.to(roomForConversation(conversationId)).emit("typing", {
      conversationId: String(conversationId),
      userId: String(userId),
    });
  });

  socket.on("seen", async ({ conversationId, messageId } = {}) => {
    if (!userId || !conversationId || !messageId) return;
    const convo = await canAccessConversation(conversationId, userId);
    if (!convo) return;

    const msg = await Message.findById(messageId).select("conversation sender").lean();
    if (!msg || String(msg.conversation) !== String(conversationId)) return;
    // Sender cannot mark own message as seen
    if (String(msg.sender) === String(userId)) return;

    io.to(roomForConversation(conversationId)).emit("seen", {
      conversationId: String(conversationId),
      messageId: String(messageId),
      seenBy: String(userId),
    });
  });

  socket.on("message:react", async ({ conversationId, messageId, emoji } = {}) => {
    if (!userId || !messageId || !emoji) return;
    const msg = await Message.findById(messageId);
    if (!msg) return;

    const convoId = conversationId || String(msg.conversation);
    const convo = await canAccessConversation(convoId, userId);
    if (!convo || String(msg.conversation) !== String(convoId)) return;

    const mine = msg.reactions.find(
      (r) => String(r.user) === String(userId) && String(r.emoji) === String(emoji)
    );
    if (!mine) {
      msg.reactions.push({ user: userId, emoji });
      await msg.save();
    }

    io.to(roomForConversation(convoId)).emit("message:react", {
      _id: String(msg._id),
      conversationId: String(convoId),
      reactions: msg.reactions,
    });
  });

  socket.on("message:edit", async ({ conversationId, messageId, text } = {}) => {
    if (!userId || !messageId || typeof text !== "string") return;
    const msg = await Message.findById(messageId).populate("sender", "fullName _id");
    if (!msg) return;

    const convoId = conversationId || String(msg.conversation);
    const convo = await canAccessConversation(convoId, userId);
    if (!convo || String(msg.conversation) !== String(convoId)) return;

    // Sender ownership enforced
    if (String(msg.sender?._id || msg.sender) !== String(userId)) return;

    msg.text = text;
    msg.edited = true;
    await msg.save();

    io.to(roomForConversation(convoId)).emit("message:updated", {
      ...msg.toObject(),
      conversationId: String(convoId),
    });
  });

  socket.on("message:delete", async ({ conversationId, messageId } = {}) => {
    if (!userId || !messageId) return;
    const msg = await Message.findById(messageId);
    if (!msg) return;

    const convoId = conversationId || String(msg.conversation);
    const convo = await canAccessConversation(convoId, userId);
    if (!convo || String(msg.conversation) !== String(convoId)) return;

    // Sender ownership enforced
    if (String(msg.sender) !== String(userId)) return;

    msg.deleted = true;
    msg.text = "";
    await msg.save();

    io.to(roomForConversation(convoId)).emit("message:deleted", {
      _id: String(msg._id),
      conversationId: String(convoId),
    });
  });

  socket.on("disconnect", () => {
    if (userId) {
      const key = String(userId);
      const set = onlineUsers.get(key) || new Set();
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(key);
        io.emit("user_status", { userId: key, status: "offline" });
      } else {
        onlineUsers.set(key, set);
      }
    }
    console.log("❌ Socket Disconnected");
  });
});

/* ===============================
   START SERVER (RAILWAY PORT FIX)
================================ */
const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    ensureAdminExists();

    // 🔁 Run once immediately on startup
    finalizeSessionsJob();

    // 🔁 Then every 1 minute
    setInterval(finalizeSessionsJob, 60 * 1000);

    server.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });
