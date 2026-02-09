import express from "express";
import { auth } from "../middleware/auth.js";
import { getMentorRecommendations } from "../controllers/recommendation.controller.js";

const router = express.Router();

// GET /api/recommendations/mentors
router.get("/mentors", auth, getMentorRecommendations);

export default router;
