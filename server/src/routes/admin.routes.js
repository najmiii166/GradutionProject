// server/src/routes/admin.routes.js

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import MentorProfile from "../models/MentorProfile.js";

const router = express.Router();

// ================== GET OVERVIEW STATS ==================
router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  try {
    const [totalStudents, totalMentors, pendingStudents, pendingMentors] =
      await Promise.all([
        User.countDocuments({ role: "student", status: "verified" }),
        User.countDocuments({ role: "mentor", status: "verified" }),
        User.countDocuments({ role: "student", status: "pending" }),
        User.countDocuments({ role: "mentor", status: "pending" }),
      ]);

    res.json({
      totalStudents,
      totalMentors,
      totalPending: pendingStudents + pendingMentors,
      pendingStudents,
      pendingMentors,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// ================== GET PENDING USERS ==================
router.get("/pending", auth, requireRole("admin"), async (req, res) => {
  try {
    const role = req.query.role === "mentor" ? "mentor" : "student";

    const users = await User.find({ role, status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (err) {
    console.error("Pending users error:", err);
    res.status(500).json({ message: "Failed to load pending users" });
  }
});

// ================== GET USER WITH FULL PROFILE ==================
router.get("/users/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "mentor") {
      profile = await MentorProfile.findOne({ user: user._id }).lean();
    }

    return res.json({ user, profile });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
});

// ================== APPROVE USER ==================
router.post(
  "/users/:id/approve",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "verified", verifiedAt: new Date() },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ message: "User approved", user });
    } catch (err) {
      console.error("Approve user error:", err);
      res.status(500).json({ message: "Failed to approve user" });
    }
  }
);

// ================== REJECT USER ==================
router.post(
  "/users/:id/reject",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ message: "User rejected", user });
    } catch (err) {
      console.error("Reject user error:", err);
      res.status(500).json({ message: "Failed to reject user" });
    }
  }
);

// ================== ANALYTICS FOR CHARTS ==================
// Only data actually used in the dashboard: studentMajors & studentUniversities
router.get("/analytics", auth, requireRole("admin"), async (req, res) => {
  try {
    const studentMajors = await StudentProfile.aggregate([
      { $group: { _id: "$major", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const studentUniversities = await User.aggregate([
      { $match: { role: "student", status: "verified" } },
      { $group: { _id: "$university", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      studentMajors,
      studentUniversities,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

// ================== GET USERS BY STATUS (verified / rejected) ==================
router.get("/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const status = req.query.status;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const users = await User.find({ status })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (err) {
    console.error("Users by status error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

export default router;
