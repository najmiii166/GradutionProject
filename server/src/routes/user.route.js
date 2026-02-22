import express from "express";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { uploadProfileImage } from "../middleware/upload.js";

const router = express.Router();

// Update name only
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName, profileImageUrl } = req.body;
    if (!fullName && typeof profileImageUrl !== "string") {
      return res.status(400).json({ message: "No profile changes provided" });
    }

    const update = {};
    if (fullName) update.fullName = fullName;
    if (typeof profileImageUrl === "string") update.profileImageUrl = profileImageUrl;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user, message: "Profile updated successfully" });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.put("/profile-image", auth, uploadProfileImage.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Profile image is required" });

    const profileImageUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImageUrl },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user, profileImageUrl, message: "Profile image updated successfully" });
  } catch (err) {
    console.error("PROFILE IMAGE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile image" });
  }
});

// allow deletion of profile image using same /api/users prefix
router.delete("/profile-image", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profileImageUrl) {
      const imgPath = path.join(process.cwd(), "server", user.profileImageUrl);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) { /* ignore */ }
      }
      user.profileImageUrl = "";
      await user.save();
    }

    res.json({ message: "Profile image removed", profileImageUrl: "" });
  } catch (err) {
    console.error("DELETE /users/profile-image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
