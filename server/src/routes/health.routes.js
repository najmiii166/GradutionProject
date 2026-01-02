import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 1=connected
  res.json({
    ok: true,
    mongoConnected: mongoState === 1,
    mongoState
  });
});

export default router;
