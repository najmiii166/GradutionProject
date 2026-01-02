// server/src/models/MentorProfile.js
import mongoose from "mongoose";

const MentorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    institution: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String },
    yearsOfExperience: { type: Number, min: 0, required: true },
    bio: { type: String, maxlength: 1000 },
    expertiseAreas: [{ type: String, trim: true }],
    availability: [
      {
        day: { type: String },
        from: { type: String },
        to: { type: String },
      },
    ],
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("MentorProfile", MentorProfileSchema);
