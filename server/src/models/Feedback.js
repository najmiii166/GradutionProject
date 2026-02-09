import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "MentorProfile", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  raterRole: { type: String, enum: ["student", "mentor"], required: true },
  rating: { type: Number, min: 1, max: 5 },
  tags: { type: [String], default: [] },
  comment: { type: String, trim: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

// unique per role per session
FeedbackSchema.index({ sessionId: 1, raterRole: 1 }, { unique: true });

export default mongoose.model("Feedback", FeedbackSchema);
