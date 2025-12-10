// server/src/models/Conversation.js
import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Last message preview (text or filename)
    lastMessage: { type: String },

    // Last activity
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
