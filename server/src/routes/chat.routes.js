// routes/chat.routes.js
import express from "express";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { auth } from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { uploadChatAttachment } from "../middleware/upload.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatUploadsDir = path.join(__dirname, "..", "..", "uploads", "chat");
const attachmentSecret =
  process.env.CHAT_ATTACHMENT_KEY || process.env.ATTACHMENT_ENCRYPTION_KEY || process.env.JWT_SECRET;
const attachmentKey = crypto.createHash("sha256").update(String(attachmentSecret || "mentorlink-chat")).digest();

let legacyEncryptionPromise = null;

function encryptBuffer(plainBuffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", attachmentKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

function decryptBuffer(encryptedBuffer, ivB64, tagB64) {
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", attachmentKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

async function encryptFileOnDisk(filePath) {
  const plain = await fs.readFile(filePath);
  const { encrypted, iv, authTag } = encryptBuffer(plain);
  await fs.writeFile(filePath, encrypted);
  return { iv, authTag };
}

async function ensureLegacyChatFilesEncrypted() {
  if (legacyEncryptionPromise) return legacyEncryptionPromise;

  legacyEncryptionPromise = (async () => {
    const legacyMessages = await Message.find({
      fileDiskName: { $exists: true, $ne: null },
      $or: [
        { fileIv: { $exists: false } },
        { fileIv: null },
        { fileAuthTag: { $exists: false } },
        { fileAuthTag: null },
      ],
    })
      .select("_id fileDiskName fileIv fileAuthTag")
      .lean();

    for (const item of legacyMessages) {
      try {
        const filePath = path.join(chatUploadsDir, item.fileDiskName);
        const { iv, authTag } = await encryptFileOnDisk(filePath);
        await Message.updateOne(
          { _id: item._id },
          { $set: { fileIv: iv, fileAuthTag: authTag } }
        );
      } catch (err) {
        console.error("Failed to encrypt legacy chat attachment", item?._id, err?.message || err);
      }
    }
  })().catch((err) => {
    console.error("Legacy chat encryption sweep failed", err);
  });

  return legacyEncryptionPromise;
}

const roomForConversation = (conversationId) => `convo:${conversationId}`;

async function getConversationIfParticipant(conversationId, userId) {
  if (!conversationId || !userId) return null;
  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) return null;
  const isParticipant =
    String(convo.mentor) === String(userId) || String(convo.student) === String(userId);
  return isParticipant ? convo : null;
}

function getTokenFromRequest(req) {
  const hdr = req.headers.authorization || "";
  if (hdr.startsWith("Bearer ")) return hdr.slice(7);
  if (typeof req.query?.token === "string" && req.query.token.trim()) return req.query.token.trim();
  return null;
}

function verifyUserFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

/* ======================================================
    CREATE or OPEN CONVERSATION
====================================================== */
router.post("/open", auth, async (req, res) => {
  const { mentorId, studentId } = req.body;

  if (!mentorId || !studentId)
    return res.status(400).json({ message: "Mentor & Student required" });

  let convo = await Conversation.findOne({ mentor: mentorId, student: studentId });

  let created = false;
  if (!convo) {
    convo = await Conversation.create({ mentor: mentorId, student: studentId });
    created = true;
  }

  // If we created a new conversation, notify both participants in real-time
  if (created) {
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(String(mentorId)).emit("conversation:created", convo);
        io.to(String(studentId)).emit("conversation:created", convo);
      }
    } catch (err) {
      console.error("Socket emit error (conversation:created):", err);
    }
  }

  res.json(convo);
});

/* ======================================================
    GET MENTOR CONVERSATIONS
====================================================== */
router.get("/mentor", auth, async (req, res) => {
  const mentorId = req.user.id;

  const convos = await Conversation.find({ mentor: mentorId })
    .populate("student", "fullName")
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json(
    convos.map((c) => ({
      _id: c._id,
      studentName: c.student?.fullName,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt || c.updatedAt,
    }))
  );
});

/* ======================================================
    GET STUDENT CONVERSATIONS
====================================================== */
router.get("/student", auth, async (req, res) => {
  const studentId = req.user.id;

  const convos = await Conversation.find({ student: studentId })
    .populate("mentor", "fullName")
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json(
    convos.map((c) => ({
      _id: c._id,
      mentorName: c.mentor?.fullName,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt || c.updatedAt,
    }))
  );
});

/* ======================================================
    LOAD ALL MESSAGES (full sender info)
====================================================== */
router.get("/:id/messages", auth, async (req, res) => {
  void ensureLegacyChatFilesEncrypted();
  const convoId = req.params.id;

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  const messages = await Message.find({ conversation: convoId })
    .populate("sender", "fullName _id") // FIXED
    .populate({
      path: "replyTo",
      select: "_id text deleted sender fileName type",
      populate: { path: "sender", select: "fullName _id" },
    })
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

/* ======================================================
    GET PARTICIPANTS
====================================================== */
router.get("/:id/participants", auth, async (req, res) => {
  const convoId = req.params.id;
  const convo = await getConversationIfParticipant(convoId, req.user.id);

  if (!convo) return res.status(404).json({ message: "Conversation not found or not allowed" });

  res.json({ mentor: String(convo.mentor), student: String(convo.student) });
});

/* ======================================================
    AUTHENTICATED ATTACHMENT DOWNLOAD
====================================================== */
router.get("/:convoId/messages/:msgId/attachment", async (req, res) => {
  void ensureLegacyChatFilesEncrypted();
  try {
    const authUser = verifyUserFromToken(req);
    if (!authUser?.id) return res.status(401).json({ message: "No token" });

    const { convoId, msgId } = req.params;
    const convo = await getConversationIfParticipant(convoId, authUser.id);
    if (!convo) return res.status(403).json({ message: "Not allowed" });

    const msg = await Message.findById(msgId).lean();
    if (!msg || String(msg.conversation) !== String(convoId) || !msg.fileDiskName) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const filePath = path.join(chatUploadsDir, msg.fileDiskName);

    if (msg.fileIv && msg.fileAuthTag) {
      let encryptedBuffer;
      try {
        encryptedBuffer = await fs.readFile(filePath);
      } catch (error) {
        if (error?.code === "ENOENT") {
          return res.status(404).json({ message: "Attachment file is missing" });
        }
        throw error;
      }

      const decryptedBuffer = decryptBuffer(encryptedBuffer, msg.fileIv, msg.fileAuthTag);
      if (msg.mimeType) res.setHeader("Content-Type", msg.mimeType);
      return res.send(decryptedBuffer);
    }

    return res.sendFile(filePath, (error) => {
      if (!error) return;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "Attachment file is missing" });
      }
      return res.status(500).json({ message: "Failed to load attachment" });
    });
  } catch (error) {
    console.error("Attachment download failed:", error);
    return res.status(500).json({ message: "Failed to load attachment" });
  }
});

/* ======================================================
    SEND MESSAGE (text/image/file/audio)
====================================================== */
router.post(
  "/:id/messages",
  auth,
  uploadChatAttachment.single("file"),
  async (req, res) => {
    void ensureLegacyChatFilesEncrypted();
    const convoId = req.params.id;
    const { text, duration, replyTo } = req.body;
    const sender = req.user.id;

    let convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant =
      String(convo.mentor) === String(sender) || String(convo.student) === String(sender);
    if (!isParticipant) return res.status(403).json({ message: "Not allowed" });

    let payload = {
      conversation: convoId,
      sender,
      text: text || null,
      type: "text",
    };

    if (replyTo) {
      const replyTarget = await Message.findById(replyTo).select("_id conversation").lean();
      if (!replyTarget || String(replyTarget.conversation) !== String(convoId)) {
        return res.status(400).json({ message: "Invalid reply target" });
      }
      payload.replyTo = replyTarget._id;
    }

    // FILE / IMAGE / AUDIO
    if (req.file) {
      const mime = req.file.mimetype;

      const filePath = path.join(chatUploadsDir, req.file.filename);
      const { iv, authTag } = await encryptFileOnDisk(filePath);

      const fileUrl = `/uploads/chat/${req.file.filename}`;

      let type = "file";
      if (mime.startsWith("image/")) type = "image";
      if (mime.startsWith("audio/")) type = "audio";

      payload = {
        ...payload,
        type,
        fileUrl,
        fileDiskName: req.file.filename,
        fileIv: iv,
        fileAuthTag: authTag,
        fileName: req.file.originalname,
        mimeType: mime,
        fileSize: req.file.size,
      };

      if (type === "audio" && duration) {
        payload.duration = Number(duration);
      }
    }

    const msg = await Message.create(payload);
    // Expose authenticated URL instead of public uploads path
    if (msg.fileDiskName) {
      msg.fileUrl = `/api/chat/${convoId}/messages/${msg._id}/attachment`;
      await msg.save();
    }

    const populated = await msg.populate([
      { path: "sender", select: "fullName _id" },
      {
        path: "replyTo",
        select: "_id text deleted sender fileName type",
        populate: { path: "sender", select: "fullName _id" },
      },
    ]);

    // Update convo preview
    convo.lastMessage =
      text || payload.fileName || (payload.type === "audio" ? "Voice message" : "Attachment");
    convo.lastMessageAt = new Date();
    await convo.save();

    // SEND SOCKET EVENT
    try {
      const io = req.app.get("io");
      const otherUserId = String(convo.mentor) === String(sender) ? convo.student : convo.mentor;

      io.to(roomForConversation(convoId)).emit("new_message", {
        ...populated.toObject(),
        conversationId: convoId,
      });

      // Emit delivered only if recipient is currently connected
      const recipientOnline =
        !!otherUserId && ((io.sockets.adapter.rooms.get(String(otherUserId))?.size || 0) > 0);
      if (recipientOnline) {
        io.to(roomForConversation(convoId)).emit("message:delivered", {
          conversationId: convoId,
          messageId: String(populated._id),
        });
      }

      // Also notify the other participant directly (user-level) so they receive a notification
      try {
        if (otherUserId) {
          io.to(String(otherUserId)).emit("notification", {
            type: "chat:new_message",
            conversationId: convoId,
            message: populated,
          });
        }
      } catch (e) {
        console.error("Failed to emit user-level chat notification:", e);
      }
    } catch (err) {
      console.error("Socket error:", err);
    }

    res.json(populated);
  }
);

/* ======================================================
    MESSAGE SEEN ✓✓
====================================================== */
router.post("/:id/seen", auth, async (req, res) => {
  const { messageId } = req.body;
  const convoId = req.params.id;

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  if (messageId) {
    const msg = await Message.findById(messageId).select("conversation sender").lean();
    if (!msg || String(msg.conversation) !== String(convoId)) {
      return res.status(400).json({ message: "Invalid message for conversation" });
    }
    // Sender cannot mark own message as seen
    if (String(msg.sender) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot mark own message as seen" });
    }
  }

  try {
    const io = req.app.get("io");
    io.to(roomForConversation(convoId)).emit("seen", { conversationId: convoId, messageId });
  } catch {}

  res.json({ success: true });
});

/* ======================================================
    REACT TO MESSAGE
====================================================== */
router.post("/:convoId/messages/:msgId/reactions", auth, async (req, res) => {
  const { emoji } = req.body;
  const { msgId, convoId } = req.params;

  if (!emoji) return res.status(400).json({ message: "Emoji required" });

  const msg = await Message.findById(msgId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  if (String(msg.conversation) !== String(convoId)) {
    return res.status(400).json({ message: "Message does not belong to conversation" });
  }

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  const user = req.user.id;

  const exists = msg.reactions.some(
    (r) => r.emoji === emoji && String(r.user) === user
  );

  if (!exists) {
    msg.reactions.push({ emoji, user });
    await msg.save();
  }

  const io = req.app.get("io");
  io.to(roomForConversation(convoId)).emit("message:react", {
    _id: msgId,
    reactions: msg.reactions,
    conversationId: convoId,
  });

  res.json({ success: true });
});

/* ======================================================
    REMOVE REACTION
====================================================== */
router.delete("/:convoId/messages/:msgId/reactions", auth, async (req, res) => {
  const { emoji } = req.body;
  const { msgId, convoId } = req.params;

  const msg = await Message.findById(msgId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  if (String(msg.conversation) !== String(convoId)) {
    return res.status(400).json({ message: "Message does not belong to conversation" });
  }

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  const user = req.user.id;

  msg.reactions = msg.reactions.filter(
    (r) => !(String(r.user) === user && (!emoji || r.emoji === emoji))
  );
  await msg.save();

  const io = req.app.get("io");
  io.to(roomForConversation(convoId)).emit("message:unreact", {
    _id: msgId,
    reactions: msg.reactions,
    conversationId: convoId,
  });

  res.json({ success: true });
});

/* ======================================================
    EDIT MESSAGE (soft edit)
====================================================== */
router.put("/:convoId/messages/:msgId", auth, async (req, res) => {
  const { text } = req.body;
  const { msgId, convoId } = req.params;

  if (typeof text !== "string") return res.status(400).json({ message: "Text required" });

  const msg = await Message.findById(msgId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  if (String(msg.conversation) !== String(convoId)) {
    return res.status(400).json({ message: "Message does not belong to conversation" });
  }

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  // Only original sender can edit
  if (String(msg.sender) !== String(req.user.id))
    return res.status(403).json({ message: "Not allowed" });

  msg.text = text;
  msg.edited = true;
  await msg.save();

  const populated = await msg.populate("sender", "fullName _id");

  // Emit updated message
  req.app.get("io").to(roomForConversation(convoId)).emit("message:updated", {
    ...populated.toObject(),
    conversationId: convoId,
  });

  res.json(populated);
});

/* ======================================================
    DELETE MESSAGE (soft delete)
====================================================== */
router.delete("/:convoId/messages/:msgId", auth, async (req, res) => {
  const { msgId, convoId } = req.params;

  const msg = await Message.findById(msgId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  if (String(msg.conversation) !== String(convoId)) {
    return res.status(400).json({ message: "Message does not belong to conversation" });
  }

  const convo = await getConversationIfParticipant(convoId, req.user.id);
  if (!convo) return res.status(403).json({ message: "Not allowed" });

  // Only original sender can delete
  if (String(msg.sender) !== String(req.user.id))
    return res.status(403).json({ message: "Not allowed" });

  msg.deleted = true;
  msg.text = "";
  await msg.save();

  // Emit deleted message event (minimal payload)
  req.app.get("io").to(roomForConversation(convoId)).emit("message:deleted", {
    _id: msg._id,
    conversationId: convoId,
  });

  res.json({ success: true });
});

export default router;
