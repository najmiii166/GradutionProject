import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import multer from "multer";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import { validationResult } from "express-validator";
import * as deepEmailValidator from "deep-email-validator";

import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  mentorRegisterRules,
  studentRegisterRules,
  loginRules,
} from "../utils/validators.js";
import { uploadIdentityAssets, uploadProfileImage } from "../middleware/upload.js";
import { auth } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../services/mailer.js";
import { buildUploadPublicUrl, deleteUploadByUrl } from "../utils/uploadStorage.js";
import { getMentorRatingSummary } from "../utils/mentorRatings.js";

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

const cleanupUploadedFiles = (files = []) => {
  for (const file of files.filter(Boolean)) {
    const uploadUrl = file?.storedPublicUrl || buildUploadPublicUrl(file?.storedRelativePath || "");
    deleteUploadByUrl(uploadUrl);
  }
};

const STUDENT_REREGISTRATION_STATUSES = new Set(["pending", "unverified"]);
const BASIC_EMAIL_RE = /^\S+@\S+\.\S+$/;

const verifyEmailMailbox = async (email) => {
  if (!BASIC_EMAIL_RE.test(String(email || "").trim())) {
    return {
      ok: false,
      reason: "invalid_format",
    };
  }

  try {
    const result = await deepEmailValidator.validate({
      email,
      sender: process.env.EMAIL_VALIDATION_SENDER || process.env.SMTP_FROM || "noreply@mentorlink.app",
      validateRegex: true,
      validateMx: true,
      validateTypo: false,
      validateDisposable: false,
      validateSMTP: true,
    });

    if (!result?.valid) {
      return {
        ok: false,
        reason: result?.reason || "smtp_rejected",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Deep email validation failed:", error);
    return {
      ok: false,
      reason: "validation_unavailable",
      unavailable: true,
    };
  }
};

const handleUploadError = (err, req, res) => {
  if (!err) return false;

  cleanupUploadedFiles([
    req.file,
    ...(req.files?.idCard || []),
    ...(req.files?.profileImage || []),
  ]);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Uploaded image is too large. Please choose an image smaller than 10MB.",
      });
    }

    return res.status(400).json({ message: err.message || "Upload failed" });
  }

  return res.status(400).json({ message: err.message || "Upload failed" });
};

const studentRegistrationUpload = (req, res, next) =>
  uploadIdentityAssets.fields([
    { name: "idCard", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ])(req, res, (err) => {
    if (handleUploadError(err, req, res)) return;
    next();
  });

const mentorRegistrationUpload = (req, res, next) =>
  uploadProfileImage.single("profileImage")(req, res, (err) => {
    if (handleUploadError(err, req, res)) return;
    next();
  });
/* =======================================================
   REGISTER MENTOR
======================================================= */
router.post("/register/mentor", mentorRegistrationUpload, mentorRegisterRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    cleanupUploadedFiles([req.file]);
    return res.status(400).json({ errors: errors.array() });
  }

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
    if (existing) {
      cleanupUploadedFiles([req.file]);
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      role: "mentor",
      fullName,
      email,
      passwordHash,
      university,
      profileImageUrl: req.file?.storedPublicUrl || "",
      status: "pending",
    });

    let expertiseList = [];
    if (Array.isArray(expertiseAreas)) {
      expertiseList = expertiseAreas.map((x) => String(x).trim()).filter(Boolean);
    } else if (typeof expertiseAreas === "string") {
      try {
        const parsed = JSON.parse(expertiseAreas);
        expertiseList = Array.isArray(parsed)
          ? parsed.map((x) => String(x).trim()).filter(Boolean)
          : [];
      } catch {
        expertiseList = String(expertiseAreas || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
    }

    let cleanAvailability = [];
    if (Array.isArray(availability)) {
      cleanAvailability = availability;
    } else if (typeof availability === "string") {
      try {
        const parsed = JSON.parse(availability);
        cleanAvailability = Array.isArray(parsed) ? parsed : [];
      } catch {
        cleanAvailability = [];
      }
    }

    cleanAvailability = cleanAvailability.map((slot) => ({
      day: String(slot.day || "").trim(),
      from: String(slot.from || "").trim(),
      to: String(slot.to || "").trim(),
    }));

    let cleanSocialLinks = {};
    if (socialLinks && typeof socialLinks === "object") {
      cleanSocialLinks = socialLinks;
    } else if (typeof socialLinks === "string") {
      try {
        const parsed = JSON.parse(socialLinks);
        cleanSocialLinks = parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        cleanSocialLinks = {};
      }
    }

    await MentorProfile.create({
      user: user._id,
      institution,
      faculty,
      department,
      yearsOfExperience,
      bio,
      expertiseAreas: expertiseList,
      availability: cleanAvailability,
      socialLinks: cleanSocialLinks,
    });

    const token = signToken(user);
    // Emit admin refresh so dashboards update in real-time
    try {
      const io = req.app && req.app.get && req.app.get('io');
      if (io) io.emit('admin:refresh', { type: 'user_registered', role: 'mentor', userId: String(user._id) });
    } catch (e) {
      console.warn('Failed to emit admin:refresh (mentor register)', e);
    }

    res.status(201).json({
      message: "Mentor registered. Await admin verification.",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        university: user.university,
        profileImageUrl: user.profileImageUrl || "",
      },
    });
  } catch (err) {
    cleanupUploadedFiles([req.file]);
    console.error("Mentor registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   REGISTER STUDENT
======================================================= */
router.post(
  "/register/student",
  studentRegistrationUpload,
  studentRegisterRules,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        cleanupUploadedFiles([...(req.files?.idCard || []), ...(req.files?.profileImage || [])]);
        return res.status(400).json({ errors: errors.array() });
      }

      const idCardFile = req.files?.idCard?.[0] || null;
      const profileImageFile = req.files?.profileImage?.[0] || null;

      if (!idCardFile) {
        cleanupUploadedFiles([profileImageFile]);
        return res.status(400).json({ message: "ID card image is required" });
      }

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
      if (existing && (existing.role !== "student" || !STUDENT_REREGISTRATION_STATUSES.has(existing.status))) {
        cleanupUploadedFiles([idCardFile, profileImageFile]);
        return res.status(409).json({
          message:
            existing.role === "student" && existing.status === "verified"
              ? "A verified account already exists with this email. Please sign in instead."
              : "Email already in use",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const idCardUrl = idCardFile?.storedPublicUrl || "";

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

      mentorshipAreasArray = mentorshipAreasArray.slice(0, 1);

      let user = existing;
      let statusCode = 201;

      if (existing) {
        const existingProfile = await StudentProfile.findOne({ user: existing._id });
        const previousUploads = [
          existing.profileImageUrl,
          existingProfile?.idCardUrl,
        ].filter(Boolean);

        existing.fullName = fullName;
        existing.passwordHash = passwordHash;
        existing.university = university;
        existing.role = "student";
        existing.status = "pending";
        existing.verifiedAt = null;
        existing.profileImageUrl = profileImageFile?.storedPublicUrl || existing.profileImageUrl || "";
        await existing.save();

        await StudentProfile.findOneAndUpdate(
          { user: existing._id },
          {
            user: existing._id,
            faculty: faculty || null,
            major: major || null,
            semester,
            idCardUrl,
            mentorshipAreas: mentorshipAreasArray,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        previousUploads.forEach((uploadUrl) => {
          if (uploadUrl && uploadUrl !== existing.profileImageUrl && uploadUrl !== idCardUrl) {
            deleteUploadByUrl(uploadUrl);
          }
        });

        user = existing;
        statusCode = 200;
      } else {
        user = await User.create({
          role: "student",
          fullName,
          email,
          passwordHash,
          university,
          profileImageUrl: profileImageFile?.storedPublicUrl || "",
          status: "pending",
        });

        await StudentProfile.create({
          user: user._id,
          faculty: faculty || null,
          major: major || null,
          semester,
          idCardUrl,
          mentorshipAreas: mentorshipAreasArray,
        });
      }

      const token = signToken(user);
      // Emit admin refresh so dashboards update in real-time
      try {
        const io = req.app && req.app.get && req.app.get('io');
        if (io) io.emit('admin:refresh', { type: 'user_registered', role: 'student', userId: String(user._id) });
      } catch (e) {
        console.warn('Failed to emit admin:refresh (student register)', e);
      }

      res.status(statusCode).json({
        message: existing
          ? "Registration updated. Await admin verification."
          : "Student registered. Await admin verification.",
        idCardUrl,
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          university: user.university,
          profileImageUrl: user.profileImageUrl || "",
        },
      });
    } catch (err) {
      cleanupUploadedFiles([...(req.files?.idCard || []), ...(req.files?.profileImage || [])]);
      console.error("Student registration error:", err);
      res.status(500).json({ message: "Server error" });
    }
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
      profileImageUrl: user.profileImageUrl || "",
    },
  });
});

/* =======================================================
   CHECK EMAIL (used by frontend step validation)
======================================================= */
router.post("/check-email", async (req, res) => {
  try {
    const { email, role } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });

    if (!BASIC_EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email format" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const requestedRole = String(role || "").trim().toLowerCase();
      const canReuseStudentEmail =
        requestedRole === "student" &&
        existing.role === "student" &&
        STUDENT_REREGISTRATION_STATUSES.has(existing.status);

      if (!canReuseStudentEmail) {
        return res.status(409).json({
          message:
            existing.role === "student" && existing.status === "verified"
              ? "A verified account already exists with this email. Please sign in instead."
              : "Email already in use",
        });
      }
    }

    const mailboxCheck = await verifyEmailMailbox(normalizedEmail);
    if (!mailboxCheck.ok) {
      if (mailboxCheck.unavailable) {
        return res.status(503).json({
          code: "EMAIL_CHECK_UNAVAILABLE",
          message: "Unable to verify email right now. Please try again.",
        });
      }

      return res.status(422).json({
        code: "EMAIL_NOT_EXIST",
        message: "Email does not exist.",
      });
    }

    return res.json({ message: "Email available", valid: true });
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
      if (profile) {
        const ratingSummary = await getMentorRatingSummary(profile._id, { includeRecent: true, recentLimit: 5 });
        // Always include profileImageUrl in mentor profile for frontend reliability
        profile.profileImageUrl = user.profileImageUrl || "";
        profile.averageRating = ratingSummary.averageRating;
        profile.totalRatings = ratingSummary.totalRatings;
        profile.badge = ratingSummary.badge;
        profile.percentPositive = ratingSummary.percentPositive;
        profile.recentRatings = ratingSummary.recentRatings.map((item) => ({
          userId: item.user,
          userName: item.userName,
          userRole: item.userRole,
          score: item.score,
          comment: item.comment,
          createdAt: item.createdAt,
        }));
        if (profile.user && typeof profile.user === 'object') {
          profile.user.profileImageUrl = user.profileImageUrl || "";
        }
      }
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
        profileImageUrl: user.profileImageUrl || "",
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
