import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
  // 🔹 Student who sent the request
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // 🔹 Mentor receiving the request
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MentorProfile",
    required: true,
  },

  // 🔹 Selected time slot
  slot: {
    day: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },

  // 🔹 Questionnaire (NEW)
  questionnaire: {
    reason: {
      type: String,
      trim: true,
    },

    goals: {
      type: [String],
      default: [],
    },

    sessionGoal: {
      type: String,
      trim: true,
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
  },

  // 🔹 Session tracking
  startTime: {
    type: Date,
  },

  endTime: {
    type: Date,
  },

  mentorJoined: { type: Boolean, default: false },
  studentJoined: { type: Boolean, default: false },
  // Audit trail of join events (button clicks)
  joinEvents: [
    new mongoose.Schema(
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["mentor", "student", "admin"], required: true },
        joinedAt: { type: Date, default: Date.now },
        source: { type: String, default: "button" },
        userAgent: { type: String },
        ip: { type: String },
      },
      { _id: false }
    ),
  ],
  firstJoinAt: { type: Date },
  lastJoinAt: { type: Date },
  noShowStatus: {
    type: String,
    enum: ["none", "student_no_show", "mentor_no_show", "both_no_show"],
    default: "none",
  },


  // 🔹 NEW: Meeting link (Google Meet, Zoom, etc.)
  meetingLink: {
    type: String,
    trim: true,
  },

  // 🔹 Request status
  status: {
    type: String,
    enum: [
      "pending",
      "upcoming",   // ✅ added (already used in your app)
      "rejected",
      "ongoing",
      "completed",
      "expired",
      
      
    ],
    default: "pending",
  },

  // 🔹 When request was created
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Request", RequestSchema);
