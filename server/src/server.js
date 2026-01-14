// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import socketAuth from "./middleware/socketAuth.js";
import { ensureAdminExists } from "./seed/seedAdmin.js";
import { finalizeSessionsJob } from "./jobs/finalizeSessions.job.js";

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
import sessionsRoutes from "./routes/sessions.routes.js";

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
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ IMPORTANT: preflight uses SAME options

app.use(express.json());
app.use(morgan("dev"));

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
app.use("/api/reports", reportsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminTicketsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/sessions", sessionsRoutes);

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

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);
  const userId = socket.user?._id;
  if (userId) socket.join(userId.toString());

  socket.on("disconnect", () => console.log("❌ Socket Disconnected"));
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
