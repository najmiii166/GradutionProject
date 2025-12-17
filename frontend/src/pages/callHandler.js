// server/socket/callHandler.js

// --- Import your models ---
// You'll need to adjust the path to your actual model files.
const Message = require("../models/Message"); // Make sure this path is correct
const Conversation = require("../models/Conversation"); // Make sure this path is correct
const onlineUsers = new Map(); // Stores userId -> socketId
const socketToUser = new Map(); // Stores socketId -> userId

const addUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
  socketToUser.set(socketId, userId);
};

const removeUser = (socketId) => {
  for (let [userId, id] of onlineUsers.entries()) {
    if (id === socketId) {
      onlineUsers.delete(userId);
      return userId;
    }
  }
  socketToUser.delete(socketId);
};

const getUserSocketId = (userId) => {
  return onlineUsers.get(userId);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    // --- Presence Management ---
    socket.on("user_online", (userId) => {
      addUser(userId, socket.id);
      // Notify other users that this user is online
      socket.broadcast.emit("user_status", { userId, status: "online" });
    });

    socket.on("disconnect", () => {
      const userId = removeUser(socket.id);
      if (userId) {
        // Notify other users that this user is offline
        io.emit("user_status", { userId, status: "offline" });
      }
    });

    // --- WebRTC Call Signaling ---

    // 1. Caller starts a call
    socket.on("call:start", async ({ targetId, offer, conversationId }) => {
      const targetSocketId = getUserSocketId(targetId);
      const callerId = socketToUser.get(socket.id); // Get caller's userId directly
      if (!callerId) return;

      if (targetSocketId) {
        // User is online: send incoming call event to target and ringing event to caller
        io.to(targetSocketId).emit("call:incoming", { fromId: callerId, offer });
        socket.emit("call:ringing");
      } else {
        // User is offline: inform the caller
        socket.emit("call:partner-offline");
      }
    });

    // 2. Receiver accepts the call
    socket.on("call:accept", ({ targetId, answer }) => {
      const targetSocketId = getUserSocketId(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:accepted", { answer });
      }
    });

    // 3. Receiver rejects the call
    socket.on("call:reject", ({ targetId }) => {
      const targetSocketId = getUserSocketId(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:rejected");
      }
    });

    // 4. Any user ends the call
    socket.on("call:end", ({ targetId }) => {
      const targetSocketId = getUserSocketId(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:ended");
      }
    });

    // 5. ICE Candidate exchange
    socket.on("call:ice-candidate", ({ targetId, candidate }) => {
      const targetSocketId = getUserSocketId(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:ice-candidate", { candidate });
      }
    });
  });
};