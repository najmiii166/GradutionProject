import mongoose from "mongoose";

const StudentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // `faculty` is the canonical faculty key (e.g., 'cs', 'business', 'health')
    faculty: { type: String, required: true },
    // `major` kept optional for legacy/free-text values
    major: { type: String },
    semester: { type: String, required: true },
    idCardUrl: { type: String, required: true },

    // NEW: areas the student wants mentorship in (e.g. ["AI", "Math"])
    mentorshipAreas: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("StudentProfile", StudentProfileSchema);
