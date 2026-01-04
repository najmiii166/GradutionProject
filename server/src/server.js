// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import httpProxy from "http-proxy";

import { connectDB } from "./config/db.js";
import socketAuth from "./middleware/socketAuth.js";
import { ensureAdminExists } from "./seed/seedAdmin.js";
import Message from "./models/Message.js";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ===============================
   ALLOWED ORIGINS (SAX AH)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  // Vercel FRONTEND (SAX)
  "https://graduation-project-eight.vercel.app",
  "https://graduation-project-git-main-najmiii166s-projects.vercel.app",
  "https://graduation-project-jixjwsqsm-najmiii166s-projects.vercel.app",

  // Railway BACKEND (PUBLIC)
  "https://graduationproject-production.up.railway.app",
];

console.log("Allowed Origins =>", allowedOrigins);

/* ===============================
   CORS
================================ */
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = !origin || allowedOrigins.includes(origin);
      console.log(
        `CORS check - origin: ${origin || "<<no origin>>"} -> ${
          allowed ? "ALLOWED" : "DENIED"
        }`
      );
      if (allowed) cb(null, true);
      else cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

/* ===============================
   STATIC FILES
================================ */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* ===============================
   ROUTES
================================ */
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

app.get("/", (_, res) => res.send("MentorLink API Running 🚀"));

/* ===============================
   SOCKET.IO
================================ */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

// Log socket handshake origin and enforce allowedOrigins for debugging
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  const allowed = !origin || allowedOrigins.includes(origin);
  console.log(
    `Socket CORS check - origin: ${origin || "<<no origin>>"} -> ${
      allowed ? "ALLOWED" : "DENIED"
    }`
  );
  if (!allowed) return next(new Error("Not allowed by CORS"));
  next();
});

io.use(socketAuth);

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

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

/* ===============================
   VITE PROXY (LOCAL ONLY)
================================ */
if (process.env.NODE_ENV !== "production") {
  const viteProxy = httpProxy.createProxyServer({
    target: "http://localhost:5174",
    ws: true,
    changeOrigin: true,
  });

  app.use((req, res, next) => {
    const url = req.url || "";
    if (
      url.startsWith("/api") ||
      url.startsWith("/uploads") ||
      url.startsWith("/socket.io")
    )
      return next();

    viteProxy.web(req, res, (err) => {
      console.error("Proxy Error:", err?.message);
      res.status(502).end("Proxy Failed");
    });
  });
}

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    ensureAdminExists();
    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });
