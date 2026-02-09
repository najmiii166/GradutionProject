import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { analyzeMentorRequestAI } from "../controllers/mentorRequestAi.controller.js";

const router = express.Router();

// POST /api/mentor/requests/:requestId/ai-analyze
router.post(
  "/requests/:requestId/ai-analyze",
  auth,
  requireRole("mentor"),
  analyzeMentorRequestAI
);

export default router;
