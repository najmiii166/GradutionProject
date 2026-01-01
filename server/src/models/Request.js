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
  // Session tracking
  startTime: { type: Date },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "scheduled", "ongoing", "completed"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Request", RequestSchema);
