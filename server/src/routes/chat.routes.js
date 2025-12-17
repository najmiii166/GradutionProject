// routes/chat.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { uploadChatAttachment } from "../middleware/upload.js";

const router = express.Router();

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
  const convoId = req.params.id;

  const messages = await Message.find({ conversation: convoId })
    .populate("sender", "fullName _id") // FIXED
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

/* ======================================================
    GET PARTICIPANTS
====================================================== */
router.get("/:id/participants", auth, async (req, res) => {
  const convoId = req.params.id;
  const convo = await Conversation.findById(convoId).lean();

  if (!convo) return res.status(404).json({ message: "Conversation not found" });

  res.json({ mentor: String(convo.mentor), student: String(convo.student) });
});

/* ======================================================
    SEND MESSAGE (text/image/file/audio)
====================================================== */
router.post(
  "/:id/messages",
  auth,
  uploadChatAttachment.single("file"),
  async (req, res) => {
    const convoId = req.params.id;
    const { text, duration } = req.body;
    const sender = req.user.id;

    let convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    let payload = {
      conversation: convoId,
      sender,
      text: text || null,
      type: "text",
    };

    // FILE / IMAGE / AUDIO
    if (req.file) {
      const mime = req.file.mimetype;
      const fileUrl = `/uploads/chat/${req.file.filename}`;

      let type = "file";
      if (mime.startsWith("image/")) type = "image";
      if (mime.startsWith("audio/")) type = "audio";

      payload = {
        ...payload,
        type,
        fileUrl,
        fileName: req.file.originalname,
        mimeType: mime,
        fileSize: req.file.size,
      };

      if (type === "audio" && duration) {
        payload.duration = Number(duration);
      }
    }

    const msg = await Message.create(payload);
    const populated = await msg.populate("sender", "fullName _id"); // FIXED

    // Update convo preview
    convo.lastMessage =
      text || payload.fileName || (payload.type === "audio" ? "Voice message" : "Attachment");
    convo.lastMessageAt = new Date();
    await convo.save();

    // SEND SOCKET EVENT
    try {
      const io = req.app.get("io");
      io.to(convoId).emit("new_message", {
        ...populated.toObject(),
        conversationId: convoId,
      });
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

  try {
    const io = req.app.get("io");
    io.to(convoId).emit("seen", { conversationId: convoId, messageId });
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

  const user = req.user.id;

  const exists = msg.reactions.some(
    (r) => r.emoji === emoji && String(r.user) === user
  );

  if (!exists) {
    msg.reactions.push({ emoji, user });
    await msg.save();
  }

  const io = req.app.get("io");
  io.to(convoId).emit("message:react", {
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

  const user = req.user.id;

  msg.reactions = msg.reactions.filter(
    (r) => !(String(r.user) === user && (!emoji || r.emoji === emoji))
  );
  await msg.save();

  const io = req.app.get("io");
  io.to(convoId).emit("message:unreact", {
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

  // Only original sender can edit
  if (String(msg.sender) !== String(req.user.id))
    return res.status(403).json({ message: "Not allowed" });

  msg.text = text;
  msg.edited = true;
  await msg.save();

  const populated = await msg.populate("sender", "fullName _id");

  // Emit updated message
  req.app.get("io").to(convoId).emit("message:updated", {
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

  // Only original sender can delete
  if (String(msg.sender) !== String(req.user.id))
    return res.status(403).json({ message: "Not allowed" });

  msg.deleted = true;
  msg.text = "";
  await msg.save();

  // Emit deleted message event (minimal payload)
  req.app.get("io").to(convoId).emit("message:deleted", {
    _id: msg._id,
    conversationId: convoId,
  });

  res.json({ success: true });
});

export default router;
