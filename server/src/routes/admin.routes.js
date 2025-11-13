import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/users/pending", auth, requireRole("admin"), async (req, res) => {
  const users = await User.find({ status: "pending" }).select("-passwordHash");
  res.json(users);
});

router.patch("/users/:id/verify", auth, requireRole("admin"), async (req, res) => {
  const { approved } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.status = approved ? "verified" : "rejected";
  user.verifiedAt = approved ? new Date() : undefined;
  await user.save();
  res.json({ message: `User ${approved ? "verified" : "rejected"}` });
});

export default router;
