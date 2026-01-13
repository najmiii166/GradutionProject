// server/src/routes/sessions.routes.js
import express from "express";
import Request from "../models/Request.js";
import { auth } from "../middleware/auth.js";
import MentorProfile from "../models/MentorProfile.js";
import { finalizeSession } from "../utils/finalizeSession.js";



function groupByMonth(sessions) {
  return sessions.reduce((acc, s) => {
    const date = new Date(s.startTime || s.requestedAt);
    const key = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
}





const router = express.Router();

// GET /api/sessions/mentor/:id
router.get("/mentor/:id", auth, async (req, res) => {
  try {
    const mentorId = req.params.id;

    if (req.user.role !== "admin") {
      const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
      if (!mentorProfile || String(mentorProfile._id) !== String(mentorId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const now = new Date();

    const sessions = await Request.find({ mentorId })
      .sort({ startTime: 1 })
      .lean();

    const toUpdate = [];

    const result = sessions.map((s) => {
      const updated = { ...s };

      if (s.startTime && s.endTime) {
        const newStatus = finalizeSession(s, now);

        if (newStatus !== s.status) {
          updated.status = newStatus;
          toUpdate.push({ id: s._id, status: newStatus });
        }
      }

      return updated;
    });

    for (const u of toUpdate) {
      await Request.findByIdAndUpdate(u.id, { status: u.status });
    }

    res.json({ success: true, sessions: result });
  } catch (err) {
    console.error("Sessions fetch error:", err);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
});

// GET /api/sessions/history/mentor
router.get("/history/mentor", auth, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only mentors allowed" });
    }

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) return res.json({});

    // 🔹 IMPORTANT: do NOT filter by status here
    const sessions = await Request.find({
      mentorId: mentorProfile._id,
      startTime: { $exists: true },
      endTime: { $exists: true },
    })
      .populate({
        path: "studentId",
        model: "User",
        select: "fullName university",
      })
      .sort({ startTime: -1 })
      .lean();

    const finalized = [];

    for (const s of sessions) {
      const newStatus = finalizeSession(s);

      // ✅ persist immediately
      if (newStatus !== s.status) {
        await Request.findByIdAndUpdate(s._id, { status: newStatus });
        s.status = newStatus;
      }

      // ✅ now safely filter
      if (s.status === "completed" || s.status === "expired") {
        finalized.push(s);
      }
    }

    res.json(groupByMonth(finalized));
  } catch (err) {
    console.error("MENTOR HISTORY ERROR:", err);
    res.status(500).json({ message: "Failed to load history" });
  }
});


// GET /api/sessions/history/student
router.get("/history/student", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students allowed" });
    }

    // 🔹 IMPORTANT: do NOT filter by status here
    const sessions = await Request.find({
      studentId: req.user.id,
      startTime: { $exists: true },
      endTime: { $exists: true },
    })
      .populate({
        path: "mentorId",
        model: "MentorProfile",
        populate: {
          path: "user",
          model: "User",
          select: "fullName",
        },
      })
      .sort({ startTime: -1 })
      .lean();

    const finalized = [];

    for (const s of sessions) {
      const newStatus = finalizeSession(s);

      // ✅ persist immediately
      if (newStatus !== s.status) {
        await Request.findByIdAndUpdate(s._id, { status: newStatus });
        s.status = newStatus;
      }

      // ✅ now safely filter
      if (s.status === "completed" || s.status === "expired") {
        finalized.push(s);
      }
    }

    res.json(groupByMonth(finalized));
  } catch (err) {
    console.error("STUDENT HISTORY ERROR:", err);
    res.status(500).json({ message: "Failed to load history" });
  }
});



export default router;
