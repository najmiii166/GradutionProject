// server/src/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: { type: String },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // -----------------------------
    // MESSAGE TYPE
    // -----------------------------
    type: {
      type: String,
      enum: ["text", "image", "file", "audio"],
      default: "text",
    },

    // -----------------------------
    // FILE / IMAGE / AUDIO FIELDS
    // -----------------------------
    fileUrl: { type: String },
    // Server-side stored filename used by authenticated attachment route
    fileDiskName: { type: String },
    fileIv: { type: String },
    fileAuthTag: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },

    // For voice messages (in seconds)
    duration: { type: Number },

    // -----------------------------
    // MESSAGE STATE
    // -----------------------------
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    // -----------------------------
    // REACTIONS
    // -----------------------------
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
