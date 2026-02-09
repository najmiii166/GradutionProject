import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
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
import { sendPasswordResetEmail } from "../services/mailer.js";

const router = express.Router();

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "If that email exists, you will receive instructions shortly." },
  
});

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
      socialLinks,
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
      socialLinks: socialLinks || {},
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
      faculty,
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

    let mentorshipAreasArray = [];
    if (mentorshipAreas) {
      if (Array.isArray(mentorshipAreas)) {
        mentorshipAreasArray = mentorshipAreas.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof mentorshipAreas === 'string') {
        // frontend may send JSON stringified array
        try {
          const parsed = JSON.parse(mentorshipAreas);
          if (Array.isArray(parsed)) mentorshipAreasArray = parsed.map((s) => String(s).trim()).filter(Boolean);
          else {
            mentorshipAreasArray = String(mentorshipAreas).split(',').map((s) => s.trim()).filter(Boolean);
          }
        } catch (err) {
          mentorshipAreasArray = String(mentorshipAreas).split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
    }

    await StudentProfile.create({
      user: user._id,
      faculty: faculty || null,
      major: major || null,
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
   CHECK EMAIL (used by frontend step validation)
======================================================= */
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    return res.json({ message: "Email available" });
  } catch (err) {
    console.error("/auth/check-email error:", err);
    return res.status(500).json({ message: "Server error" });
  }
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

router.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

router.post("/forgot-password", forgotPasswordLimiter, csrfProtection, async (req, res) => {
  const { email } = req.body || {};
  const genericResponse = { message: "If that email exists, you will receive instructions shortly." };

  try {
    if (typeof email !== "string" || !email.trim()) {
      return res.status(200).json(genericResponse);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(200).json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPassword = {
      token: hashedToken,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
    };

    await user.save();
    await sendPasswordResetEmail({ to: user.email, name: user.fullName, token: rawToken });

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("POST /auth/forgot-password error:", err);
    return res.status(200).json(genericResponse);
  }
});

router.post("/reset-password", csrfProtection, async (req, res) => {
  const { token, password } = req.body || {};
  const genericError = { message: "Invalid or expired reset link." };

  try {
    if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
      return res.status(400).json(genericError);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      "resetPassword.token": hashedToken,
      "resetPassword.expiresAt": { $gt: Date.now() },
    });

    if (!user) return res.status(400).json(genericError);

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPassword = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Your password has been updated. Please log in with your new credentials." });
  } catch (err) {
    console.error("POST /auth/reset-password error:", err);
    return res.status(400).json(genericError);
  }
});

export default router;
