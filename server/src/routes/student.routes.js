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
        // rating metadata
        averageRating: m.averageRating || 0,
        totalRatings: m.totalRatings || 0,
        percentPositive: (() => {
          try {
            const arr = m.ratings || [];
            if (!arr.length) return 0;
            const ok = arr.filter((r) => (r.score || 0) >= 4).length;
            return Math.round((ok / arr.length) * 100);
          } catch (e) { return 0; }
        })(),
        badge: m.averageRating ? (m.badge || "—") : "—",
      }));

    res.json({ mentorshipAreas, mentors });
  } catch (err) {
    console.error("Student matches error:", err);
    res.status(500).json({ message: "Failed to load mentor matches" });
  }
});

/* =======================================================
   UPDATE STUDENT PROFILE (post-approval)
   Allows a verified student to complete or edit their profile
   PUT /api/student/profile
   body (json): { faculty, major, semester, mentorshipAreas, about, idCardUrl }
======================================================= */
router.put("/profile", auth, requireRole("student"), async (req, res) => {
  try {
    // Only allow profile edits after admin verification
    if (req.user.status !== "verified") {
      return res.status(403).json({ message: "Profile completion allowed only after verification." });
    }

    const { faculty, major, semester, mentorshipAreas, about, idCardUrl } = req.body;

    // normalize mentorshipAreas: accept array, JSON-string, or CSV
    let areas = [];
    if (Array.isArray(mentorshipAreas)) {
      areas = mentorshipAreas.map((a) => String(a || "").trim()).filter(Boolean);
    } else if (typeof mentorshipAreas === "string") {
      try {
        areas = JSON.parse(mentorshipAreas);
        if (!Array.isArray(areas)) areas = [];
        areas = areas.map((a) => String(a || "").trim()).filter(Boolean);
      } catch (e) {
        areas = String(mentorshipAreas || "").split(",").map((a) => a.trim()).filter(Boolean);
      }
    }

    const update = {
      ...(faculty ? { faculty } : {}),
      ...(major ? { major } : {}),
      ...(semester ? { semester } : {}),
      ...(about ? { about } : {}),
      ...(idCardUrl ? { idCardUrl } : {}),
    };
    if (areas.length) update.mentorshipAreas = areas;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ message: "Profile updated", profile });
  } catch (err) {
    console.error("Failed to update student profile:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
