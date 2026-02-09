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

/* ===============================
   ALLOWED ORIGINS (RAILWAY FIX)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://graduation-project-eight.vercel.app",
  "https://gradution-project-git-main-najmiii166s-projects.vercel.app",
  "https://gradution-project-najmiii166s-projects.vercel.app" // Vercel main link
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Ogolaansho sii haddii uu ku jiro liiska ama uu yahay vercel subdomain
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
}));

app.options("*", cors()); // Enable pre-flight for all routes

app.use(cookieParser());
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


// HEALTH CHECK

app.get("/", (_, res) => res.send("MentorLink API Running on Railway 🚀"));

const server = http.createServer(app);
app.set("trust proxy", 1);

const io = new Server(server, {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  cors: { origin: allowedOrigins, credentials: true }
});

app.set("io", io);

io.use(socketAuth);

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
  } else {
    console.warn("Socket connected without userId; no user room joined");
  }

  socket.on("disconnect", () => console.log("❌ Socket Disconnected"));
});

/* ===============================
   START SERVER (RAILWAY PORT FIX)
================================ */
// Railway wuxuu u baahan yahay 0.0.0.0 si uu dibadda u aqbalo requests
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