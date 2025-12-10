import express from "express";
import StudentProfile from "../models/StudentProfile.js";
import MentorProfile from "../models/MentorProfile.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

/* ============================
   GET MATCHING MENTORS
============================ */
router.get("/matches", auth, requireRole("student"), async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user.id }).lean();
    if (!studentProfile) {
      return res.status(404).json({
        message: "Student profile not found",
        mentorshipAreas: [],
        mentors: [],
      });
    }

    const mentorshipAreas = studentProfile.mentorshipAreas || [];
    if (mentorshipAreas.length === 0) {
      return res.json({ mentorshipAreas, mentors: [] });
    }

    // Find mentors with matching expertise areas
    const mentorProfiles = await MentorProfile.find({
      expertiseAreas: { $in: mentorshipAreas },
    })
      .populate("user", "fullName university status role")
      .lean();

    // Include only verified mentors and relevant fields
    const mentors = mentorProfiles
      .filter((m) => m.user?.status === "verified" && m.user?.role === "mentor")
      .map((m) => ({
        _id: m._id,
        user: m.user,
        institution: m.institution,
        faculty: m.faculty,
        department: m.department,
        bio: m.bio,
        yearsOfExperience: m.yearsOfExperience ?? 0, // ✅ ensure it always exists
        expertiseAreas: m.expertiseAreas,
        availability: m.availability || [],
      }));

    res.json({ mentorshipAreas, mentors });
  } catch (err) {
    console.error("Student matches error:", err);
    res.status(500).json({ message: "Failed to load mentor matches" });
  }
});

export default router;
