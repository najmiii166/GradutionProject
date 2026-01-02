import { Router } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 1=connected
  res.json({
    ok: true,
    mongoConnected: mongoState === 1,
    mongoState
  });
});

// Health check that includes OpenAI configuration status
router.get("/health/full", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 1=connected
  const hasOpenAi = !!process.env.OPENAI_API_KEY;
  res.json({
    ok: true,
    mongoConnected: mongoState === 1,
    mongoState,
    openaiConfigured: hasOpenAi,
  });
});

export default router;
