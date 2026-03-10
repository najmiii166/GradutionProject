import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { mentorRegisterRules, loginRules } from "../utils/validators.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import Request from "../models/Request.js";
import { generateMentorSummary } from "../services/mentorSummary.service.js";
import { getMentorBadge, getMentorRatingSummary } from "../utils/mentorRatings.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );


/* =======================================================
   MENTOR REGISTRATION
======================================================= */
router.post("/register", mentorRegisterRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const {
      fullName,
      email,
      password,
      institution,
      faculty,
      department,
      yearsOfExperience,
      bio,
      expertiseAreas,
      availability,
      university,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      role: "mentor",
      fullName,
      email,
      passwordHash,
      university,
      status: "pending",
    });

    const expertiseList = Array.isArray(expertiseAreas)
      ? expertiseAreas.map((x) => String(x).trim())
      : String(expertiseAreas || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

    const cleanAvailability = Array.isArray(availability)
      ? availability.map((slot) => ({
          day: String(slot.day || "").trim(),
          from: String(slot.from || "").trim(),
          to: String(slot.to || "").trim(),
        }))
      : [];

    await MentorProfile.create({
      user: user._id,
      institution,
      faculty,
      department,
      yearsOfExperience,
      bio,
      expertiseAreas: expertiseList,
      availability: cleanAvailability,
    });

    res.status(201).json({ message: "Mentor registered. Await admin verification." });
  } catch (err) {
    console.error("Mentor registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/* =======================================================
   LOGIN
======================================================= */
router.post("/login", loginRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.role !== "mentor")
      return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        university: user.university,
      },
    });
  } catch (err) {
    console.error("Mentor login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   UPDATE AVAILABILITY
======================================================= */
router.put("/availability", auth, requireRole("mentor"), async (req, res) => {
  try {
    const availability = Array.isArray(req.body.availability)
      ? req.body.availability.map((slot) => ({
          day: String(slot.day || "").trim(),
          from: String(slot.from || "").trim(),
          to: String(slot.to || "").trim(),
        }))
      : [];

    const updated = await MentorProfile.findOneAndUpdate(
      { user: req.user.id },
      { availability },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      message: "Availability updated successfully",
      availability: updated.availability,
    });
  } catch (err) {
    console.error("Failed to update mentor availability", err);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

/* =======================================================
   GET STUDENT REQUESTS (Mentor Dashboard)
======================================================= */
router.get("/requests", auth, requireRole("mentor"), async (req, res) => {
  try {
    const requests = await Request.find({
      mentorId: req.user.id,
      status: "pending",
    })
      .populate({
        path: "studentId",
        model: "User",
        select: "fullName email university profileImageUrl",
      })
      .populate({
        path: "studentProfile",
        model: "StudentProfile",
        select: "major semester",
      })
      .sort({ requestedAt: -1 })
      .lean();

    const formatted = requests.map((r) => ({
      _id: r._id,
      studentId: r.studentId?._id,
      studentName: r.studentId?.fullName || "Student",
      studentImage: r.studentId?.profileImageUrl || "",
      studentUniversity: r.studentId?.university || "—",
      major: r.studentProfile?.major || "",
      semester: r.studentProfile?.semester || "",
      requestedAt: r.requestedAt,
      note: r.note || "",
      status: r.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET mentor requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   ACCEPT OR REJECT REQUEST
======================================================= */
router.patch("/requests/:id", auth, requireRole("mentor"), async (req, res) => {
  try {
    const { action } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this request." });
    }

    if (action === "accept") {
      request.status = "accepted";
    } else if (action === "reject") {
      request.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    await request.save();
    res.json({ success: true, message: `Request ${action}ed successfully.` });
  } catch (err) {
    console.error("PATCH mentor request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   GET STUDENT PROFILE (Mentor View)
======================================================= */
router.get("/students/:id", auth, requireRole("mentor"), async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching student:", studentId);

    const studentProfile = await StudentProfile.findOne({ user: studentId })
      .populate("user", "fullName email university profileImageUrl")
      .lean();

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    return res.json({
      fullName: studentProfile.user?.fullName || "Unknown",
      email: studentProfile.user?.email || "",
      profileImageUrl: studentProfile.user?.profileImageUrl || "",
      university: studentProfile.user?.university || "",
      major: studentProfile.major || "",
      faculty: studentProfile.faculty || "",
      semester: studentProfile.semester || "",
      about: studentProfile.about || "",
      mentorshipAreas: studentProfile.mentorshipAreas || [],
    });
  } catch (err) {
    console.error("GET student profile error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =======================================================
   GET MENTOR PROFILE (Student View)
   Allows a student to fetch a mentor's public profile by user id
======================================================== */
router.get("/mentors/:id", auth, requireRole("student"), async (req, res) => {
  try {
    const mentorId = req.params.id;

    const mentorProfile = await MentorProfile.findOne({ user: mentorId })
      .populate("user", "fullName email university profileImageUrl")
      .populate({
        path: "ratings.user",
        model: "User",
        select: "fullName role",
      })
      .lean();

    if (!mentorProfile) {
      return res.status(404).json({ message: "Mentor profile not found." });
    }

    const ratingSummary = await getMentorRatingSummary(mentorProfile._id, {
      includeRecent: true,
      recentLimit: 5,
    });

    return res.json({
      userId: mentorProfile.user?._id,
      fullName: mentorProfile.user?.fullName || "Unknown",
      email: mentorProfile.user?.email || "",
      profileImageUrl: mentorProfile.user?.profileImageUrl || "",
      university: mentorProfile.user?.university || "",
      institution: mentorProfile.institution || "",
      faculty: mentorProfile.faculty || "",
      department: mentorProfile.department || "",
      bio: mentorProfile.bio || "",
      yearsOfExperience: mentorProfile.yearsOfExperience || 0,
      expertiseAreas: mentorProfile.expertiseAreas || [],
      availability: mentorProfile.availability || [],
      averageRating: ratingSummary.averageRating,
      totalRatings: ratingSummary.totalRatings,
      percentPositive: ratingSummary.percentPositive,
      badge: ratingSummary.badge,
      recentRatings: ratingSummary.recentRatings.map((item) => ({
        userId: item.user,
        userName: item.userName,
        userRole: item.userRole,
        score: item.score,
        comment: item.comment,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET mentor profile error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =======================================================
   RATE A MENTOR (student -> mentor)
   POST /api/mentor/mentors/:id/rate
   body: { score: number (1-5), comment?: string }
======================================================== */
router.post("/mentors/:id/rate", auth, requireRole("student"), async (req, res) => {
  try {
    const mentorUserId = req.params.id;
    const { score, comment } = req.body;

    const parsed = Number(score);
    if (!parsed || parsed < 1 || parsed > 5) return res.status(400).json({ message: "Score must be 1-5" });

    const profile = await MentorProfile.findOne({ user: mentorUserId });
    if (!profile) return res.status(404).json({ message: "Mentor profile not found" });

    const existing = profile.ratings.find((r) => String(r.user) === String(req.user.id));
    if (existing) {
      existing.score = parsed;
      if (comment !== undefined) existing.comment = comment;
      existing.createdAt = new Date();
    } else {
      profile.ratings.push({ user: req.user.id, score: parsed, comment });
    }

    // Recalculate cached stats
    const total = profile.ratings.length;
    const sum = profile.ratings.reduce((s, r) => s + (r.score || 0), 0);
    profile.totalRatings = total;
    profile.averageRating = total ? Math.round((sum / total) * 10) / 10 : 0; // 1 decimal

    await profile.save();

    return res.json({
      success: true,
      averageRating: profile.averageRating,
      totalRatings: profile.totalRatings,
    });
  } catch (err) {
    console.error("Rate mentor error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   GET RATINGS FOR A MENTOR (public)
   GET /api/mentor/mentors/:id/ratings
   returns array of { userId, userName, userRole, score, comment, createdAt, isNowMentor }
======================================================== */
router.get("/mentors/:id/ratings", async (req, res) => {
  try {
    const mentorUserId = req.params.id;

    const profile = await MentorProfile.findOne({ user: mentorUserId }).lean();

    if (!profile) return res.status(404).json({ message: "Mentor profile not found" });

    const ratingSummary = await getMentorRatingSummary(profile._id, {
      includeRecent: true,
      recentLimit: 50,
    });

    const list = (ratingSummary.recentRatings || []).map((item) => ({
      userId: item.user,
      userName: item.userName,
      userRole: item.userRole,
      score: item.score,
      comment: item.comment,
      createdAt: item.createdAt,
      isNowMentor: item.userRole === "mentor",
    }));

    return res.json(list);
  } catch (err) {
    console.error("GET mentor ratings error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   STATS / DUMMY ROUTES (avoid dashboard 404s)
======================================================= */
router.get("/stats", auth, requireRole("mentor"), async (req, res) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.user.id })
      .select("averageRating totalRatings ratings")
      .lean();

    if (!profile) {
      return res.json({ averageRating: 0, totalRatings: 0, credits: 0, badge: "—" });
    }

    const ratingSummary = await getMentorRatingSummary(profile._id);
    const credits = await Request.countDocuments({
      mentorId: profile._id,
      status: "completed",
    });

    return res.json({
      averageRating: ratingSummary.averageRating,
      totalRatings: ratingSummary.totalRatings,
      credits,
      badge: ratingSummary.badge || getMentorBadge(profile.averageRating, profile.totalRatings),
      percentPositive: ratingSummary.percentPositive,
    });
  } catch (err) {
    console.error("GET mentor stats error:", err);
    return res.status(500).json({ message: "Failed to load mentor stats" });
  }
});
router.get("/sessions/upcoming", (req, res) => res.json([]));

/* =======================================================
   AI SUMMARY FOR A REQUEST
   GET /api/mentor/requests/:requestId/ai-summary
   - Auth: mentor only
   - Authorization: mentor must own the request
   - Returns strict JSON { summary, keyPoints[], difficulty, suggestedAgenda[] }
   - Rate limit: 5 requests per mentor per 10 minutes (in-memory)
======================================================== */
const aiSummaryRate = new Map(); // mentorUserId -> { windowStart, count }

router.get("/requests/:requestId/ai-summary", auth, requireRole("mentor"), async (req, res) => {
  try {
    const mentorUserId = req.user.id;
    const requestId = req.params.requestId;

    const request = await Request.findById(requestId).lean();
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Ensure the authenticated mentor owns this request (mentorId references MentorProfile)
    const mentorProfile = await MentorProfile.findOne({ user: mentorUserId }).lean();
    if (!mentorProfile) return res.status(403).json({ message: "Mentor profile not found" });
    if (String(request.mentorId) !== String(mentorProfile._id)) {
      return res.status(403).json({ message: "Not authorized for this request" });
    }

    // Simple in-memory rate limit: 5 per 10 minutes
    const now = Date.now();
    const wnd = aiSummaryRate.get(mentorUserId) || { windowStart: now, count: 0 };
    const tenMin = 10 * 60 * 1000;
    if (now - wnd.windowStart > tenMin) {
      wnd.windowStart = now;
      wnd.count = 0;
    }
    if (wnd.count >= 5) {
      return res.status(429).json({ message: "Rate limit exceeded. Try again later." });
    }
    wnd.count += 1;
    aiSummaryRate.set(mentorUserId, wnd);

    const q = request.questionnaire || {};
    const slot = request.slot || {};
    const result = await generateMentorSummary({
      reason: String(q.reason || "").trim(),
      goals: Array.isArray(q.goals) ? q.goals.slice(0, 8) : [],
      sessionGoal: String(q.sessionGoal || "").trim(),
      experienceLevel: String(q.experienceLevel || "").trim(),
      slot: {
        day: String(slot.day || "").trim(),
        from: String(slot.from || "").trim(),
        to: String(slot.to || "").trim(),
      },
      language: String(req.query?.lang || req.body?.language || "en").trim().toLowerCase() === "so" ? "so" : "en",
    });

    return res.json({
      success: true,
      data: {
        ...result,
        suggestedAgenda: [],
      },
    });
  } catch (err) {
    console.error("AI summary error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/conversations", (req, res) => res.json([]));
router.get("/conversations/:id/messages", (req, res) => res.json([]));

export default router;
