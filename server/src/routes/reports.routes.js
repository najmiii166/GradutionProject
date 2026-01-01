import express from "express";
import { auth } from "../middleware/auth.js";
import {
  generateReport,
  getHistory,
  viewReport,
  downloadReportPdf,
  listReports,
  getReportData,
} from "../controllers/report.controller.js";

const router = express.Router();

router.post("/generate", auth, generateReport);
router.get("/data", auth, getReportData);
router.get("/list", auth, listReports);
router.get("/history/:userId", auth, getHistory);
router.get("/view/:id", auth, viewReport);
router.get("/pdf/:id", auth, downloadReportPdf);

export default router;
