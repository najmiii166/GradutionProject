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
        select: "fullName email university",
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
      .populate("user", "fullName email university")
      .lean();

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    return res.json({
      fullName: studentProfile.user?.fullName || "Unknown",
      email: studentProfile.user?.email || "",
      university: studentProfile.user?.university || "",
      major: studentProfile.major || "",
      semester: studentProfile.semester || "",
      about: studentProfile.about || "",
      idCardUrl: studentProfile.idCardUrl || "",
    });
  } catch (err) {
    console.error("GET student profile error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =======================================================
   STATS / DUMMY ROUTES (avoid dashboard 404s)
======================================================= */
router.get("/stats", (req, res) =>
  res.json({ averageRating: 0, totalRatings: 0, credits: 0, badge: "—" })
);
router.get("/sessions/upcoming", (req, res) => res.json([]));
router.get("/conversations", (req, res) => res.json([]));
router.get("/conversations/:id/messages", (req, res) => res.json([]));

export default router;
