import mongoose from "mongoose";
import { recommendMentors } from "../utils/recommendations.js";

// GET /api/recommendations/mentors
// Query: ?studentId=...&limit=3
export async function getMentorRecommendations(req, res, next) {
  try {
    const q = req.query || {};
    let studentId = q.studentId;
    const role = req.user?.role;

    // If student and no query param provided, use authenticated user id
    if (!studentId && role === "student") {
      studentId = req.user?.id;
    }

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    // limit: default 3, max 10
    let limit = Number(q.limit);
    if (!Number.isFinite(limit) || limit <= 0) limit = 3;
    limit = Math.min(10, Math.max(1, Math.floor(limit)));

    const preferredDays = q.preferredDays;

    const recommended = await recommendMentors({ studentId, limit, preferredDays });

    return res.json({ success: true, data: { studentId, recommended } });
  } catch (err) {
    return next(err);
  }
}

export default { getMentorRecommendations };
