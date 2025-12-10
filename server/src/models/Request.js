import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  slot: {
    day: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "upcoming", "completed"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Request", RequestSchema);
