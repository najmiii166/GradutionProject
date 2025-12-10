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
// Proxy to Vite dev server (for HMR) when frontend is loaded through backend port
const viteProxy = httpProxy.createProxyServer({ target: "http://localhost:5174", ws: true, changeOrigin: true });
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow frontend to be configured via env, fallback to common dev ports
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = [FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:5174"].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ------------------ ROUTES ------------------
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);

// Chat route
app.use("/api/chat", chatRoutes);

app.get("/", (_, res) => res.send("MentorLink API"));

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.use(socketAuth); // authenticate socket connections

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(conversationId);
  });

  socket.on("leave_conversation", ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // Handle message edits coming from clients
  socket.on("message:edit", async (data) => {
    try {
      const { messageId, text } = data || {};
      if (!messageId || typeof text !== "string") return;

      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Only original sender may edit
      if (String(msg.sender) !== String(socket.user.id)) return;

      msg.text = text;
      msg.edited = true;
      await msg.save();

      const populated = await msg.populate("sender", "fullName _id");

      // Emit updated message to the conversation room
      socket.to(msg.conversation.toString()).emit("message:updated", populated.toObject());
      socket.emit("message:updated", populated.toObject());
    } catch (err) {
      console.error("message:edit handler error:", err);
    }
  });

  // Handle message deletes (soft delete)
  socket.on("message:delete", async (data) => {
    try {
      const { messageId } = data || {};
      if (!messageId) return;

      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Only original sender may delete
      if (String(msg.sender) !== String(socket.user.id)) return;

      msg.deleted = true;
      msg.text = "";
      await msg.save();

      const payload = { _id: msg._id, conversationId: msg.conversation };

      socket.to(msg.conversation.toString()).emit("message:deleted", payload);
      socket.emit("message:deleted", payload);
    } catch (err) {
      console.error("message:delete handler error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Make io available inside routes
app.set("io", io);

// Proxy non-API and non-upload requests to Vite dev server so HMR works
app.use((req, res, next) => {
  try {
    const url = req.url || "";

    // Don't proxy API, uploads or backend socket.io paths
    if (url.startsWith("/api") || url.startsWith("/uploads") || url.startsWith("/socket.io")) return next();

    // Proxy everything else to Vite (dev server)
    viteProxy.web(req, res, (err) => {
      console.error("Vite proxy error (web):", err && err.message);
      res.statusCode = 502;
      res.end("Bad Gateway (Vite proxy)");
    });
  } catch (err) {
    next(err);
  }
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    // Handle websocket upgrade proxying for HMR (forward to Vite) except backend socket.io
    server.on("upgrade", (req, socket, head) => {
      try {
        const reqUrl = new URL(req.url || "", `http://localhost`);
        if (reqUrl.pathname && reqUrl.pathname.startsWith("/socket.io")) {
          // Let the server's Socket.IO handle this upgrade
          return;
        }

        // Otherwise forward upgrade (HMR websocket) to Vite dev server
        viteProxy.ws(req, socket, head);
      } catch (err) {
        console.error("Upgrade proxy error:", err && err.message);
        socket.destroy();
      }
    });

    server.listen(port, () =>
      console.log(`API + Socket running on http://localhost:${port}`)
    );
  })
  .catch((e) => {
    console.error("DB connect error:", e);
    process.exit(1);
  });


  
  io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // JOIN SPECIFIC USER ROOM
  const userId = socket.user?._id;
  if (userId) socket.join(userId);

  // ------------------------------
  // CALL: SEND OFFER
  // ------------------------------
  socket.on("call:offer", (data) => {
    io.to(data.targetId).emit("call:incoming", {
      fromId: data.fromId,
      fromName: data.fromName,
      offer: data.offer,
    });
  });

  // ------------------------------
  // CALL: SEND ANSWER
  // ------------------------------
  socket.on("call:answer", (data) => {
    io.to(data.targetId).emit("call:answer", {
      answer: data.answer,
    });
  });

  // ------------------------------
  // CALL: ICE CANDIDATES
  // ------------------------------
  socket.on("call:ice-candidate", (data) => {
    io.to(data.targetId).emit("call:ice-candidate", {
      candidate: data.candidate,
    });
  });

  // ------------------------------
  // CALL: REJECT CALL
  // ------------------------------
  socket.on("call:reject", (data) => {
    io.to(data.targetId).emit("call:rejected");
  });

  // ------------------------------
  // CALL: END CALL
  // ------------------------------
  socket.on("call:end", (data) => {
    io.to(data.targetId).emit("call:ended");
  });
});
