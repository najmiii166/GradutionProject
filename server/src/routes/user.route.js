import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { uploadProfileImage } from "../middleware/upload.js";
import {
  deleteUploadByUrl,
  resolveUploadAbsolutePath,
} from "../utils/uploadStorage.js";

const router = express.Router();

const authFromHeaderOrQuery = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : req.query?.token;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Update name only
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName },
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

    const existingUser = await User.findById(req.user.id).select("profileImageUrl");
    const profileImageUrl = req.file.storedPublicUrl;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImageUrl },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (existingUser?.profileImageUrl && existingUser.profileImageUrl !== profileImageUrl) {
      deleteUploadByUrl(existingUser.profileImageUrl);
    }

    res.json({ user, profileImageUrl, message: "Profile image updated successfully" });
  } catch (err) {
    deleteUploadByUrl(req.file?.storedPublicUrl);
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
      deleteUploadByUrl(user.profileImageUrl);
      user.profileImageUrl = "";
      await user.save();
    }

    res.json({ message: "Profile image removed", profileImageUrl: "" });
  } catch (err) {
    console.error("DELETE /users/profile-image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const sendProtectedIdCard = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const relativePath = ["idcards", req.params.segment1, req.params.segment2, req.params.file]
      .filter(Boolean)
      .join("/");

    const { absolutePath, category } = resolveUploadAbsolutePath(`/uploads/${relativePath}`);
    if (category !== "idcards") {
      return res.status(400).json({ message: "Invalid file category" });
    }

    return res.sendFile(absolutePath, (error) => {
      if (!error) return;
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "File not found" });
      }
      return res.status(500).json({ message: "Failed to load file" });
    });
  } catch (err) {
    return res.status(400).json({ message: "Invalid file path" });
  }
};

router.get("/files/idcards/:file", authFromHeaderOrQuery, sendProtectedIdCard);
router.get(
  "/files/idcards/:segment1/:segment2/:file",
  authFromHeaderOrQuery,
  sendProtectedIdCard
);

export default router;
