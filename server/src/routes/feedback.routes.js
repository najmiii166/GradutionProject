import express from "express";
import { auth } from "../middleware/auth.js";
import Feedback from "../models/Feedback.js";
import Request from "../models/Request.js";
import MentorProfile from "../models/MentorProfile.js";

const router = express.Router();

// POST /api/feedback
router.post("/", auth, async (req, res) => {
  try {
    const { sessionId, rating, comment, tags } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, message: "Missing sessionId" });

    const session = await Request.findById(sessionId).lean();
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    // Only allow participants
    const role = req.user.role;
    let isStudent = false;
    let isMentor = false;
    if (role === "student") isStudent = String(session.studentId) === String(req.user.id);
    if (role === "mentor") {
      const mentorProfile = await MentorProfile.findById(session.mentorId).populate({ path: "user", model: "User", select: "_id" }).lean();
      isMentor = mentorProfile?.user?._id && String(mentorProfile.user._id) === String(req.user.id);
    }

    if (!isStudent && !isMentor && role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Only allow if completed
    if (session.status !== "completed") {
      return res.status(400).json({ success: false, message: "Feedback allowed only after completion" });
    }

    // Validation
    if (isStudent) {
      const r = Number(rating);
      if (!(r >= 1 && r <= 5)) {
        return res.status(400).json({ success: false, message: "Rating 1..5 required for student" });
      }
    }
    if (comment && String(comment).length > 500) {
      return res.status(400).json({ success: false, message: "Comment too long (max 500)" });
    }

    const doc = new Feedback({
      sessionId,
      requestId: sessionId,
      mentorId: session.mentorId,
      studentId: session.studentId,
      raterRole: isMentor ? "mentor" : "student",
      rating: isStudent ? Number(rating) : (rating ? Number(rating) : undefined),
      tags: Array.isArray(tags) ? tags : [],
      comment: comment || "",
    });

    try {
      await doc.save();
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ success: false, message: "Feedback already submitted" });
      }
      throw err;
    }

    if (isStudent) {
      const ratingItems = await Feedback.find({
        mentorId: session.mentorId,
        raterRole: "student",
        rating: { $exists: true, $gt: 0 },
      })
        .select("studentId rating comment createdAt")
        .lean();

      const totalRatings = ratingItems.length;
      const averageRating = totalRatings
        ? Number(
            (
              ratingItems.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
              totalRatings
            ).toFixed(2)
          )
        : 0;

      await MentorProfile.findByIdAndUpdate(session.mentorId, {
        $set: {
          ratings: ratingItems.map((item) => ({
            user: item.studentId,
            score: Number(item.rating || 0),
            comment: item.comment || "",
            createdAt: item.createdAt || new Date(),
          })),
          totalRatings,
          averageRating,
        },
      });
    }

    res.json({ success: true, data: { id: doc._id } });
  } catch (err) {
    console.error("Feedback submit error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/feedback/session/:sessionId
router.get("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Request.findById(sessionId).lean();
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    // Only participants or admin
    const role = req.user.role;
    let allowed = false;
    if (role === "admin") allowed = true;
    if (role === "student" && String(session.studentId) === String(req.user.id)) allowed = true;
    if (role === "mentor") {
      const mentorProfile = await MentorProfile.findById(session.mentorId).populate({ path: "user", model: "User", select: "_id" }).lean();
      if (mentorProfile?.user?._id && String(mentorProfile.user._id) === String(req.user.id)) allowed = true;
    }
    if (!allowed) return res.status(403).json({ success: false, message: "Forbidden" });

    const items = await Feedback.find({ sessionId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Feedback fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/feedback/mentor/:mentorId/summary
router.get("/mentor/:mentorId/summary", auth, async (req, res) => {
  try {
    const { mentorId } = req.params;
    // Student ratings drive mentor summary
    const items = await Feedback.find({ mentorId, raterRole: "student", rating: { $exists: true } }).lean();
    const total = items.length;
    const sum = items.reduce((acc, it) => acc + Number(it.rating || 0), 0);
    const avg = total ? (sum / total) : 0;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const it of items) {
      const r = Math.round(Number(it.rating || 0));
      if (breakdown[r] !== undefined) breakdown[r]++;
    }
    res.json({ success: true, data: { averageRating: Number(avg.toFixed(2)), totalReviews: total, breakdown } });
  } catch (err) {
    console.error("Mentor summary error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
