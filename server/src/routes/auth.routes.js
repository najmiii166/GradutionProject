import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import { mentorRegisterRules, studentRegisterRules, loginRules } from "../utils/validators.js";
import { uploadIdCard } from "../middleware/upload.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, status: user.status }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Mentor registration (pending until admin verifies)
router.post("/register/mentor", mentorRegisterRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    fullName, email, password, institution, faculty, department,
    yearsOfExperience, bio, expertiseAreas, university
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ role: "mentor", fullName, email, passwordHash, university, status: "pending" });
  await MentorProfile.create({ user: user._id, institution, faculty, department, yearsOfExperience, bio, expertiseAreas });

  return res.status(201).json({ message: "Mentor registered. Await admin verification." });
});

// Student registration (pending until admin verifies)
router.post(
  "/register/student",
  uploadIdCard.single("idCard"),          // <-- handle image file field named idCard
  studentRegisterRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.file) return res.status(400).json({ message: "ID card image is required" });

    const { fullName, email, password, university, major, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      role: "student",
      fullName,
      email,
      passwordHash,
      university,
      status: "pending"            // <-- admin approval required
    });
    
    // Build public URL for the uploaded image
    const idCardUrl = `/uploads/idcards/${req.file.filename}`;

    await StudentProfile.create({
      user: user._id,
      major,
      semester,
      idCardUrl
    });

    return res.status(201).json({
      message: "Student registered. Await admin verification.",
      idCardUrl
    });
  }
);

// Login (returns token even if pending; frontend should block features for non-verified users)
router.post("/login", loginRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user);
  return res.json({ token, role: user.role, status: user.status, fullName: user.fullName });
});

export default router;
