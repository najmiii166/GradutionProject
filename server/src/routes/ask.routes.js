import express from "express";
import { auth } from "../middleware/auth.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import { generateAssistantReply } from "../services/askAssistant.service.js";

const router = express.Router();

// Simple per-user rate limit: 10 requests per minute
const rateState = new Map(); // userId -> { windowStart:number, count:number }
function checkRateLimit(userId) {
  const now = Date.now();
  const winMs = 60 * 1000;
  const rec = rateState.get(userId) || { windowStart: now, count: 0 };
  if (now - rec.windowStart > winMs) {
    rec.windowStart = now;
    rec.count = 0;
  }
  rec.count += 1;
  rateState.set(userId, rec);
  return rec.count <= 10;
}

function detectLanguage(lang, message) {
  if (lang === "en" || lang === "so") return lang;
  // naive detection: if contains common Somali words, use so
  const m = String(message || "").toLowerCase();
  const somaliHints = ["sidee", "sida", "maalin", "kulanka", "macalin", "baro", "barashada", "maxay", "sabab" ];
  const looksSomali = somaliHints.some((w) => m.includes(w));
  return looksSomali ? "so" : "en";
}

const FAQ_MAP = {
  en: {
    FIND_MENTOR: "Go to Mentors, filter by expertise or availability, open a mentor profile, then click ‘Send Request’.",
    BOOKING_WORKS: "Pick a time slot on a mentor’s profile, send a request, await approval. You’ll see the session under Upcoming Sessions.",
    PLATFORM_SUMMARY: "MentorLink helps students connect with mentors, schedule sessions, and exchange messages and reports.",
    NEXT_SESSION: "Open Dashboard → Upcoming Sessions to view your next session details and link.",
    SUPPORT: "Open Support from the sidebar to submit a ticket or start a support conversation.",
  },
  so: {
    FIND_MENTOR: "Tag bogga Mentors, ka raadi khibrad ama waqti, fur profaylka macalinka, kadib guji ‘Send Request’.",
    BOOKING_WORKS: "Dooro waqti ku habboon profaylka macalinka, dir codsi, sug oggolaanshaha. Kulanka ‘Upcoming Sessions’ ayaad ka heli doontaa.",
    PLATFORM_SUMMARY: "MentorLink waxay kaa caawisaa isku xirka ardayda iyo macallimiinta, jadwalaynta kulamada, iyo wadaagista fariimaha/warbixinada.",
    NEXT_SESSION: "Fur Dashboard → Upcoming Sessions si aad u aragto faahfaahinta kulankaaga xiga.",
    SUPPORT: "Fur Support si aad u gudbiso codsi caawimo ama wada sheekeysi taageero.",
  },
};

function matchFaqKey(message) {
  const m = String(message || "").toLowerCase();
  if (!m) return null;
  if (m.includes("find a mentor") || m.includes("how to find a mentor")) return "FIND_MENTOR";
  if (m.includes("booking works") || m.includes("how booking works") || m.includes("how to book")) return "BOOKING_WORKS";
  if (m.includes("what does this system do") || m.includes("platform summary") || m.includes("what is mentorlink")) return "PLATFORM_SUMMARY";
  if (m.includes("next session")) return "NEXT_SESSION";
  if (m.includes("support")) return "SUPPORT";
  return null;
}

async function studentMyNextSession(user) {
  const next = await Request.findOne({ studentId: user.id, status: { $in: ["upcoming", "ongoing"] } })
    .sort({ startTime: 1 })
    .populate({ path: "mentorId", model: "MentorProfile", populate: { path: "user", model: "User", select: "fullName" } })
    .lean();
  if (!next) return "You have no upcoming sessions.";
  const when = next.startTime ? new Date(next.startTime).toLocaleString() : "scheduled soon";
  const mentorName = next.mentorId?.user?.fullName || "your mentor";
  return `Your next session is ${when} with ${mentorName}.`;
}

async function studentMyRequests(user) {
  const pending = await Request.countDocuments({ studentId: user.id, status: "pending" });
  const upcoming = await Request.countDocuments({ studentId: user.id, status: "upcoming" });
  const ongoing = await Request.countDocuments({ studentId: user.id, status: "ongoing" });
  if (!pending && !upcoming && !ongoing) return "You have no active requests at the moment.";
  return `You have ${pending} pending, ${upcoming} upcoming, and ${ongoing} ongoing requests.`;
}

async function mentorMyPendingRequests(user) {
  const profile = await MentorProfile.findOne({ user: user.id }).lean();
  if (!profile) return "No mentor profile found.";
  const pending = await Request.countDocuments({ mentorId: profile._id, status: "pending" });
  if (!pending) return "You have no pending requests.";
  return `You have ${pending} pending request(s).`;
}

async function mentorMyNextSession(user) {
  const profile = await MentorProfile.findOne({ user: user.id }).lean();
  if (!profile) return "No mentor profile found.";
  const next = await Request.findOne({ mentorId: profile._id, status: { $in: ["upcoming", "ongoing"] } }).sort({ startTime: 1 }).lean();
  if (!next) return "You have no upcoming sessions.";
  const when = next.startTime ? new Date(next.startTime).toLocaleString() : "scheduled soon";
  return `Your next session is ${when}.`;
}

async function adminPlatformSummary() {
  const totalUsers = await User.countDocuments({});
  const mentors = await User.countDocuments({ role: "mentor" });
  const students = await User.countDocuments({ role: "student" });
  const pendingRequests = await Request.countDocuments({ status: "pending" });
  return `Platform users: ${totalUsers} total (${mentors} mentors, ${students} students). Pending requests: ${pendingRequests}.`;
}

router.post("/ask", auth, async (req, res) => {
  try {
    const user = req.user; // { id, role }
    if (!checkRateLimit(user.id)) {
      return res.status(429).json({
        success: false,
        message: "You’re asking too fast. Please wait a moment and try again.",
      });
    }

    const intent = (req.body?.intent || "").trim() || null;
    const msg = (req.body?.message || "").trim();
    const language = detectLanguage(req.body?.language, msg);

    // A) FAQ / Platform Help (static, NO LLM)
    if ((intent && intent.startsWith("FAQ_")) || matchFaqKey(msg)) {
      const key = intent?.replace(/^FAQ_/, "") || matchFaqKey(msg);
      const pack = FAQ_MAP[language] || FAQ_MAP.en;
      const reply = pack?.[key] || (language === "so" ? "Caawinta madal-ka lama helin." : "Couldn’t find platform help for that question.");
      return res.json({ success: true, data: { reply, actions: [] } });
    }

    // B) MY DATA (role-enforced, NO LLM)
    if (intent === "STUDENT_MY_NEXT_SESSION") {
      if (user.role !== "student") return res.status(403).json({ success: false, message: "This request is only available for students." });
      const reply = await studentMyNextSession(user);
      return res.json({ success: true, data: { reply } });
    }
    if (intent === "STUDENT_MY_REQUESTS") {
      if (user.role !== "student") return res.status(403).json({ success: false, message: "This request is only available for students." });
      const reply = await studentMyRequests(user);
      return res.json({ success: true, data: { reply } });
    }
    if (intent === "MENTOR_MY_PENDING_REQUESTS") {
      if (user.role !== "mentor") return res.status(403).json({ success: false, message: "This request is only available for mentors." });
      const reply = await mentorMyPendingRequests(user);
      return res.json({ success: true, data: { reply } });
    }
    if (intent === "MENTOR_MY_NEXT_SESSION") {
      if (user.role !== "mentor") return res.status(403).json({ success: false, message: "This request is only available for mentors." });
      const reply = await mentorMyNextSession(user);
      return res.json({ success: true, data: { reply } });
    }
    if (intent === "ADMIN_PLATFORM_SUMMARY") {
      if (user.role !== "admin") return res.status(403).json({ success: false, message: "This request is only available for admins." });
      const reply = await adminPlatformSummary();
      return res.json({ success: true, data: { reply } });
    }

    // C) Coaching / Explanation (Gemini allowed)
    if (!msg) return res.status(400).json({ success: false, message: "Please include a message to ask the assistant." });
    const reply = await generateAssistantReply({ message: msg, language });
    return res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error("/api/ask error:", err);
    return res.status(500).json({ success: false, message: "The AI service is temporarily unavailable, but I can still help with platform guidance." });
  }
});

export default router;
