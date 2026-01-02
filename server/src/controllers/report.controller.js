import Report from "../models/Report.js";
import { generateReportFromPrompt } from "../utils/reportGenerator.js";
import { buildReportPrompt } from "../utils/reportPrompt.js";
import { buildReportOutput } from "../utils/reportOutput.js";
import StudentProfile from "../models/StudentProfile.js";
import { getGlobalMetrics, buildDateFilter, getScopedMetricsForUser, safeAggregate } from "../utils/metrics.js";

// Local fallback report generator used when OpenAI fails
function generateFallbackReport(metrics, type, rangeLabel) {
  const lines = [];
  lines.push(`${type} – ${rangeLabel}`);
  lines.push("\nExecutive Summary:\n");
  lines.push(`This report provides a summary for ${rangeLabel}.`);
  lines.push("\nKey Metrics:\n");
  lines.push(`- Total students: ${metrics.totalStudents}`);
  lines.push(`- Total mentors: ${metrics.totalMentors}`);
  lines.push(`- Completed sessions: ${metrics.completedSessions}`);
  // include pending accounts (users waiting verification) and pending mentoring requests
  if (typeof metrics.pendingAccounts !== 'undefined') {
    lines.push(`- Pending accounts: ${metrics.pendingAccounts}`);
  }
  lines.push(`- Pending requests: ${metrics.pendingRequests}`);
  if (metrics.topMentors && metrics.topMentors.length) {
    lines.push("\nTop Mentors:");
    metrics.topMentors.forEach((m, i) => {
      lines.push(`  ${i + 1}. ${m.name} — ${m.sessions} sessions`);
    });
  }
  lines.push("\nInsights:\n");
  lines.push("- Monitor mentor workloads and consider onboarding more mentors if sessions keep increasing.");
  lines.push("- Follow up on pending requests to improve completion rates.");
  lines.push("\nRecommendations:\n");
  lines.push("- Continue tracking these metrics and schedule a deeper analysis monthly.");
  return lines.join("\n");
}

/**
 * Helper: compute date range for common tokens
 */
function computeRange(range, from, to) {
  const now = new Date();
  let start = null;
  let end = null;

  switch (range) {
    case "last30":
      end = new Date(now);
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case "lastMonth": {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(firstOfThisMonth);
      end.setMilliseconds(-1);
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
    }
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      break;
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }
    case "custom":
      start = from ? new Date(from) : null;
      end = to ? new Date(to) : null;
      break;
    default:
      // fallback to last 30 days
      end = new Date(now);
      start = new Date(now);
      start.setDate(start.getDate() - 30);
  }

  // normalize end to end of day if provided
  if (end) {
    end = new Date(end);
    end.setHours(23, 59, 59, 999);
  }
  if (start) start = new Date(start);

  return { start, end };
}

// Format a user-friendly label for the selected range token
function formatRangeLabel(rangeToken, start, end, from, to) {
  switch (rangeToken) {
    case "last30":
      return "Last 30 days";
    case "lastMonth":
      return "Last Month";
    case "thisMonth":
      return "This Month";
    case "quarter":
      return "This Quarter";
    case "custom": {
      const s = start ? new Date(start).toLocaleDateString() : (from ? new Date(from).toLocaleDateString() : "");
      const e = end ? new Date(end).toLocaleDateString() : (to ? new Date(to).toLocaleDateString() : "");
      if (s && e) return `${s} - ${e}`;
      if (s) return s;
      return "Custom Range";
    }
    default:
      return "Last 30 days";
  }
}

// POST /api/reports/generate
export async function generateReport(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role || "user";

    const { type, range, from, to } = req.body || {};

    // validate input
    if (!type || !range) return res.status(400).json({ message: "Missing type or range" });

    // compute date window
    const { start, end } = computeRange(range, from, to);

    const rangeLabel = formatRangeLabel(range, start, end, from, to);
    const title = `${type} – ${rangeLabel}`;

    // Use centralized metrics util to compute authoritative counts (applies createdAt/requestedAt correctly)
    const dateStart = start ? start.toISOString() : null;
    const dateEnd = end ? end.toISOString() : null;
    const metricsBase = await getGlobalMetrics({ start: dateStart, end: dateEnd });

    const totalStudents = metricsBase.totalStudents;
    const totalMentors = metricsBase.totalMentors;
    const completedSessions = metricsBase.completedSessions;
    const pendingRequests = metricsBase.pendingRequests;
    const pendingAccounts = metricsBase.pendingAccounts;
    const topMentors = metricsBase.topMentors;

    // Per-report-type aggregations (mentor activity, student engagement, request workload)
    const normType = String(type || "").toLowerCase();
    const typeSpecific = {};

    // Use request date filter for detailed aggregations
    const requestDateFilter = buildDateFilter(start ? start.toISOString() : null, end ? end.toISOString() : null);
    const aggMatch = requestDateFilter ? { requestedAt: requestDateFilter } : {};

    if (normType.includes("mentor")) {
      const mentorAgg = await safeAggregate(Request, [
        { $match: { status: "completed", ...(aggMatch) } },
        { $group: { _id: "$mentorId", sessions: { $sum: 1 } } },
        { $sort: { sessions: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "mentor",
          },
        },
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        { $project: { mentorId: "$_id", sessions: 1, name: "$mentor.fullName" } },
      ]);

      const pendingByMentor = await safeAggregate(Request, [
        { $match: { status: "pending", ...(aggMatch) } },
        { $group: { _id: "$mentorId", pending: { $sum: 1 } } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "mentor",
          },
        },
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        { $project: { mentorId: "$_id", pending: 1, name: "$mentor.fullName" } },
      ]);

      typeSpecific.mentorSessions = (mentorAgg || []).map((m) => ({ name: m.name || "Unknown", sessions: m.sessions || 0 }));
      typeSpecific.pendingByMentor = (pendingByMentor || []).map((m) => ({ name: m.name || "Unknown", pending: m.pending || 0 }));
    } else if (normType.includes("student")) {
      const studentAgg = await safeAggregate(Request, [
        { $match: { status: "completed", ...(aggMatch) } },
        { $group: { _id: "$studentId", sessions: { $sum: 1 } } },
        { $sort: { sessions: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        { $project: { studentId: "$_id", sessions: 1, name: "$student.fullName" } },
      ]);

      const majors = await safeAggregate(StudentProfile, [
        { $group: { _id: "$major", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      typeSpecific.studentSessions = (studentAgg || []).map((s) => ({ name: s.name || "Unknown", sessions: s.sessions || 0 }));
      typeSpecific.topMajors = (majors || []).map((m) => ({ major: m._id || "Unknown", count: m.count || 0 }));
    } else if (normType.includes("request") || normType.includes("workload")) {
      const pendingList = await Request.find({ status: "pending", ...(aggMatch) })
        .limit(200)
        .sort({ requestedAt: -1 })
        .populate("studentId", "fullName email")
        .populate("mentorId", "fullName email")
        .lean();

      const pendingMapped = pendingList.map((r) => ({
        id: r._id,
        student: r.studentId ? r.studentId.fullName || r.studentId.email : null,
        mentor: r.mentorId ? r.mentorId.fullName || r.mentorId.email : null,
        requestedAt: r.requestedAt,
        topic: r.topic || r.subject || null,
      }));

      const workloadCounts = await safeAggregate(Request, [
        { $match: { ...(aggMatch) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      typeSpecific.pendingRequests = pendingMapped;
      typeSpecific.workloadCounts = workloadCounts.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {});
    }

    let metrics = {
      totalStudents,
      totalMentors,
      completedSessions,
      pendingRequests,
      pendingAccounts,
      topMentors,
      typeSpecific,
      range: { start: start ? start.toISOString() : null, end: end ? end.toISOString() : null },
    };

    // Use authoritative DB-computed metrics only. Do not trust client-supplied metrics
    // to avoid stale or tampered data overriding real analytics.

    // Build structured prompt using utility
    const prompt = buildReportPrompt(metrics, type, metrics.range);

    // Call OpenAI Chat Completion (expects OPENAI_API_KEY in env)
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: "OpenAI API key not configured" });

    // Call OpenAI Chat Completion
    let reportText = "";
    let usedFallback = false;
    let structured = null;
    try {
      const openAiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a professional data analyst and report writer." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1200,
        }),
      });

      if (!openAiResp.ok) {
        const txt = await openAiResp.text();
        console.error("OpenAI error:", openAiResp.status, txt);
        // fallback to local structured generator
        structured = await generateReportFromPrompt({ contextPrompt: null, dataInput: metrics, fullPrompt: null });
        usedFallback = true;
        reportText = structured.fullText || structured.aiText || String(structured.summary || "");
      } else {
        const openAiData = await openAiResp.json();
        // AI returned a plain text report. Keep text and build structured output around it.
        reportText = openAiData?.choices?.[0]?.message?.content?.trim() || "";
        structured = buildReportOutput(reportText, metrics, type, rangeLabel, null);
      }
    } catch (errFetch) {
      console.error("OpenAI request exception:", errFetch?.message || errFetch);
      structured = await generateReportFromPrompt({ contextPrompt: null, dataInput: metrics, fullPrompt: null });
      usedFallback = true;
      reportText = structured.fullText || structured.aiText || String(structured.summary || "");
    }

    // Ensure structured output exists
    if (!structured) structured = buildReportOutput(reportText, metrics, type, rangeLabel, null);

    // Save report to DB (include generated title and html)
    const report = await Report.create({
      user: userId,
      role,
      type,
      range,
      title,
      generatedText: structured.fullText || reportText,
      summary: structured.summary || String(structured.fullText || reportText).slice(0, 200),
      htmlReport: structured.html,
      insights: structured.keyInsights || structured.insights || [],
      risks: structured.risks || [],
      recommendations: structured.recommendations || [],
      createdAt: new Date(),
    });

    const respPayload = { success: true, report: { id: report._id, title: report.title }, output: structured, metrics };
    if (usedFallback) respPayload.fallback = true;
    return res.json(respPayload);
  } catch (err) {
    console.error("Report generation error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Failed to generate report" });
  }
}

// GET /api/reports/history/:userId
export async function getHistory(req, res) {
  try {
    const { userId } = req.params;

    // Only allow owner or admin
    if (String(req.user.id) !== String(userId) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not allowed" });

    const reports = await Report.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.json({ reports });
  } catch (err) {
    console.error("Get history error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/reports/view/:id
export async function viewReport(req, res) {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Only owner or admin
    if (String(report.user) !== String(req.user.id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not allowed" });

    return res.json({ report });
  } catch (err) {
    console.error("View report error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/reports/pdf/:id
export async function downloadReportPdf(req, res) {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Only owner or admin
    if (String(report.user) !== String(req.user.id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not allowed" });

    const html = report.htmlReport || "<p>No report content available.</p>";

    // Try dynamic import of puppeteer. If not installed, fall back to cached PDF content.
    let puppeteerModule = null;
    try {
      puppeteerModule = await import("puppeteer");
    } catch (e) {
      puppeteerModule = null;
    }

    if (!puppeteerModule) {
      // If we have a cached PDF in the report, return it.
      if (report.pdfContent) {
        const pdfBuffer = Buffer.from(report.pdfContent, "base64");
        res.set({
          "Content-Type": "application/pdf",
          "Content-Length": pdfBuffer.length,
          "Content-Disposition": `attachment; filename="report-${id}.pdf"`,
        });
        return res.send(pdfBuffer);
      }

      console.error("Puppeteer is not installed and no cached PDF exists for report", id);
      return res.status(500).json({ message: "PDF generation unavailable: install puppeteer in the server or regenerate report with server-side PDF support." });
    }

    const puppeteer = puppeteerModule.default || puppeteerModule;

    // Launch headless browser to render PDF
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="report-${id}.pdf"`,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({ message: "Failed to generate PDF" });
  }
}

// GET /api/reports/list
export async function listReports(req, res) {
  try {
    // admins see all reports; other users see their own
    const filter = req.user.role === "admin" ? {} : { user: req.user.id };
    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, reports });
  } catch (err) {
    console.error("List reports error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/reports/data
export async function getReportData(req, res) {
  try {
    // Use centralized metrics util for authoritative, consistent metrics
    const metrics = await getGlobalMetrics();
    const globalMetrics = {
      totalStudents: metrics.totalStudents,
      totalMentors: metrics.totalMentors,
      pendingAccounts: metrics.pendingAccounts,
      completedSessions: metrics.completedSessions,
      pendingRequests: metrics.pendingRequests,
      topMentors: metrics.topMentors,
    };

    // Scoped metrics for the requesting user (useful for mentors/students)
    let scoped = {};
    if (req.user && (req.user.role === "mentor" || req.user.role === "student")) {
      // use helper for consistent per-user counts
      const scopedCounts = await getScopedMetricsForUser(req.user);
      scoped = scopedCounts;
    } else {
      // admins or anonymous -> scoped equals global
      scoped = { ...globalMetrics };
    }

    return res.json({
      success: true,
      metrics: {
        global: globalMetrics,
        scoped,
      },
    });
  } catch (err) {
    console.error("Get report data error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
