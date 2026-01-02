import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  mentorRegisterRules,
  studentRegisterRules,
  loginRules,
} from "../utils/validators.js";
import { uploadIdCard } from "../middleware/upload.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* =======================================================
   TOKEN HELPER
======================================================= */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* =======================================================
   REGISTER MENTOR
======================================================= */
router.post("/register/mentor", mentorRegisterRules, async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   REGISTER STUDENT
======================================================= */
router.post(
  "/register/student",
  uploadIdCard.single("idCard"),
  studentRegisterRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.file)
      return res.status(400).json({ message: "ID card image is required" });

    const {
      fullName,
      email,
      password,
      university,
      major,
      semester,
      mentorshipAreas,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      role: "student",
      fullName,
      email,
      passwordHash,
      university,
      status: "pending",
    });

    const idCardUrl = `/uploads/idcards/${req.file.filename}`;

    const mentorshipAreasArray = mentorshipAreas
      ? String(mentorshipAreas)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    await StudentProfile.create({
      user: user._id,
      major,
      semester,
      idCardUrl,
      mentorshipAreas: mentorshipAreasArray,
    });

    res.status(201).json({
      message: "Student registered. Await admin verification.",
      idCardUrl,
    });
  }
);

/* =======================================================
   LOGIN (shared for both)
======================================================= */
router.post("/login", loginRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

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
});

/* =======================================================
   GET LOGGED-IN USER (used by dashboard)
======================================================= */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;
    if (user.role === "mentor") {
      profile = await MentorProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    }

    res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        university: user.university,
        status: user.status,
      },
      profile,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
