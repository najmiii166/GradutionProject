// server/src/routes/request.route.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Request from "../models/Request.js";
import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { finalizeSession } from "../utils/finalizeSession.js";
import { generateRequestDraft } from "../services/aiDraft.service.js";


const router = express.Router();

// Simple per-user rate limiter for AI draft generation
const aiDraftRate = new Map();
function checkRateLimit(userId, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const rec = aiDraftRate.get(userId) || { count: 0, start: now };
  if (now - rec.start > windowMs) {
    // reset window
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  aiDraftRate.set(userId, rec);
  return rec.count <= limit;
}

// Helper: strict join window (UTC via ISO Date parsing)
function computeCanJoin(startTime, endTime, minutesBefore = 5) {
  try {
    if (!startTime) return false;
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    const now = new Date();
    const openAt = new Date(start.getTime() - minutesBefore * 60 * 1000);
    return now >= openAt && now <= end;
  } catch {
    return false;
  }
}

/* ============================
   CREATE REQUEST (STUDENT)
============================ */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can send requests." });
    }

    const studentId = req.user.id;
    const { mentorId, slot, questionnaire, parentSessionId, isFollowUp } = req.body;


    if (!mentorId || !slot) {
      return res.status(400).json({ success: false, message: "Missing mentor or slot." });
    }

    // minimal slot validation
    const day = slot?.day;
    const from = slot?.from;
    const to = slot?.to;
    if (!day || !from || !to) {
      return res.status(400).json({ success: false, message: "Slot requires day, from and to." });
    }

    // Block double-booking for accepted (upcoming/ongoing) slots
    const occupied = await Request.findOne({
      mentorId,
      status: { $in: ["upcoming", "ongoing"] },
      "slot.day": day,
      "slot.from": from,
      "slot.to": to,
    }).lean();

    if (occupied) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked. Please pick another slot.",
      });
    }

    // Prevent having more than 2 active requests across all mentors
    const activeCount = await Request.countDocuments({
      studentId,
      status: { $in: ["pending", "upcoming", "ongoing"] },
    });

    if (activeCount >= 2) {
      return res.status(400).json({
        message: "You cannot have more than 2 active requests at the same time.",
      });
    }

    // Also prevent duplicate active request for the same mentor
    const activeExisting = await Request.findOne({
      studentId,
      mentorId,
      status: { $in: ["pending", "upcoming", "ongoing"] },
    }).sort({ requestedAt: -1 });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "You already have an active request with this mentor.",
        data: { existingRequestId: exists._id, status: exists.status },
      });
    }

    let parent = null;
    if (parentSessionId) {
      parent = await Request.findById(parentSessionId).lean();
      if (!parent || String(parent.studentId) !== String(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid parent session for follow-up." });
      }
      if (String(parent.mentorId) !== String(mentorId)) {
        return res.status(400).json({ success: false, message: "Follow-up must target the same mentor as the original session." });
      }
    }

    const newReq = await Request.create({
      studentId,
      mentorId,
      slot,
      questionnaire,
      status: "pending",
      requestedAt: new Date(),
      parentSessionId: parent ? parent._id : undefined,
      isFollowUp: !!parent || !!isFollowUp,
    });

    // Emit notification to mentor (notify by mentor's linked User id)
    try {
      const io = req.app.get("io");
      if (io) {
        const mentorProfile = await MentorProfile.findById(mentorId).populate({ path: "user", model: "User", select: "_id" }).lean();
        const mentorUserId = mentorProfile?.user?._id;
        // load student basic info for nicer notification payload
        const studentUser = await User.findById(studentId).select("fullName _id").lean();
        const payload = {
          _id: newReq._id,
          studentId: studentId,
          studentName: studentUser?.fullName || "Student",
          requestedAt: newReq.requestedAt,
          slot: newReq.slot,
          status: newReq.status,
          isFollowUp: newReq.isFollowUp,
        };

        if (mentorUserId) {
          io.to(String(mentorUserId)).emit("notification", {
            type: "request:created",
            request: payload,
          });
        }
      }
    } catch (err) {
      console.error("Failed to emit socket notification (request:create):", err);
    }

    res.json(newReq);
  } catch (err) {
    console.error("REQUEST CREATE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================
   GET OCCUPIED SLOTS FOR A MENTOR (UPCOMING/ONGOING)
   Used by students to disable booked slots in UI
============================ */
router.get("/mentor/:id/occupied-slots", auth, async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ message: "Missing mentor id" });

    const occupied = await Request.find({
      mentorId: req.params.id,
      status: { $in: ["upcoming", "ongoing"] },
    })
      .select("slot")
      .lean();

    const slots = occupied
      .map((r) => r.slot)
      .filter((s) => s && s.day && s.from && s.to)
      .map((s) => ({ day: s.day, from: s.from, to: s.to }));

    res.json(slots);
  } catch (err) {
    console.error("GET occupied slots error", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   GET STUDENT REQUESTS
============================ */
router.get("/student", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view this." });
    }

    const requests = await Request.find({ studentId: req.user.id })
      .populate({
        path: "mentorId",
        model: "MentorProfile",
        populate: {
          path: "user",
          model: "User",
          select: "fullName email university institution status role",
        },
      })
      .sort({ requestedAt: -1 })
      .lean();

    const updates = [];

    const finalized = requests.map((r) => {
      const newStatus = finalizeSession(r);

      if (newStatus !== r.status) {
        updates.push({ id: r._id, status: newStatus });
        const withStatus = { ...r, status: newStatus };
        // Optional flag: canJoin strictly within 5 min before start until end
        withStatus.canJoin = computeCanJoin(withStatus.startTime, withStatus.endTime, 5);
        return withStatus;
      }
      const withFlag = { ...r };
      withFlag.canJoin = computeCanJoin(withFlag.startTime, withFlag.endTime, 5);
      return withFlag;
    });

    // persist changes
    for (const u of updates) {
      await Request.findByIdAndUpdate(u.id, { status: u.status });
    }

    res.json(finalized);
  } catch (err) {
    console.error("GET STUDENT REQUESTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ============================
   GET MENTOR REQUESTS
============================ */
router.get("/mentor", auth, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only mentors can view this." });
    }

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id }).populate({ path: 'user', model: 'User', select: 'fullName _id' });
    if (!mentorProfile) return res.json([]);

    const requests = await Request.find({
      mentorId: mentorProfile._id,
      status: "pending",
    })
      .populate({
        path: "studentId",
        model: "User",
        select: "fullName email university",
      })
      .sort({ requestedAt: -1 })
      .lean();

    // Enrich each with student profile info
    for (const r of requests) {
      const sp = await StudentProfile.findOne({ user: r.studentId._id }).lean();
      r.studentName = r.studentId.fullName;
      r.studentUniversity = r.studentId.university;
      r.studentId.faculty = sp?.faculty || "—";
  r.studentId.major = sp?.major || "—";
  r.studentId.semester = sp?.semester || "—";
    }

    res.json(requests);
  } catch (err) {
    console.error("GET MENTOR REQUESTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   ACCEPT / REJECT REQUEST
============================ */
router.patch("/mentor/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only mentors can update requests." });
    }

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) {
      return res.status(404).json({ message: "Mentor profile not found." });
    }

    const { action } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.mentorId.toString() !== mentorProfile._id.toString()) {
      return res.status(403).json({ message: "Not your request to manage." });
    }

    if (action === "accept") {
  const { day, from, to } = request.slot;

  const dayMap = {
    sunday: 0, monday: 1, tuesday: 2,
    wednesday: 3, thursday: 4,
    friday: 5, saturday: 6,
    sun: 0, mon: 1, tue: 2,
    wed: 3, thu: 4,
    fri: 5, sat: 6,
  };

  const now = new Date();
  const targetDay = dayMap[day.toLowerCase()];
  if (targetDay === undefined) {
    return res.status(400).json({ message: "Invalid day" });
  }

const nextDate = new Date(now);
const dayDiff = (targetDay - now.getDay() + 7) % 7;

// Same day → check time
if (dayDiff === 0) {
  const [fromH, fromM] = from.split(":");
  const slotStartToday = new Date(now);
  slotStartToday.setHours(fromH, fromM, 0, 0);

  // If slot time already passed → next week
  if (slotStartToday <= now) {
    nextDate.setDate(now.getDate() + 7);
  }
  // else: keep today
} else {
  nextDate.setDate(now.getDate() + dayDiff);
}


  const [fromH, fromM] = from.split(":");
  const [toH, toM] = to.split(":");

  const startTime = new Date(nextDate);
  startTime.setHours(fromH, fromM, 0, 0);

  const endTime = new Date(nextDate);
  endTime.setHours(toH, toM, 0, 0);

  request.startTime = startTime;
  request.endTime = endTime;
  request.status = "upcoming";

}

     else if (action === "reject") {
      request.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    await request.save();
    // Notify the student about the decision
try {
  const io = req.app.get("io");
  if (io) {
    const studentId = request.studentId;

    const mentorUser = await User.findById(mentorProfile.user)
      .select("fullName")
      .lean();

    const payload = {
      _id: request._id,
      status: request.status, // "upcoming" or "rejected"
      mentorName: mentorUser?.fullName || "Mentor",
      slot: request.slot,
      startTime: request.startTime,
      endTime: request.endTime,
      requestedAt: request.requestedAt,
    };

    io.to(String(studentId)).emit("notification", {
      type: request.status === "upcoming"
        ? "request:accepted"
        : "request:rejected",
      request: payload,
    }); 
  }
} catch (err) {
  console.error("Failed to emit socket notification:", err);
}


    res.json({ message: `Request ${action}ed successfully`, request });
  } catch (err) {
    console.error("REQUEST ACTION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   UPCOMING SESSIONS (MENTOR)
============================ */
router.get("/mentor/upcoming", auth, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only mentors can view this." });
    }

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) return res.json([]);

    const sessions = await Request.find({
      mentorId: mentorProfile._id,
      status: { $in: ["upcoming", "ongoing"] },
    })
      .populate({
        path: "studentId",
        model: "User",
        select: "fullName university",
      })
      .sort({ requestedAt: -1 })
      .lean();

   const updates = [];

    const formatted = sessions.map((s) => {
      const newStatus = finalizeSession(s);

      if (newStatus !== s.status) {
        updates.push({ id: s._id, status: newStatus });
      }

      return {
        _id: s._id,
        studentId: s.studentId._id,
        studentName: s.studentId.fullName,
        studentUniversity: s.studentId.university,
        dayOfWeek: s.slot?.day || "",
        from: s.slot?.from || "",
        to: s.slot?.to || "",
        status: newStatus,
        startTime: s.startTime,
        endTime: s.endTime,
        meetingLink: s.meetingLink || "",
        requestedAt: s.requestedAt,
        // Optional helper flag: strict join window in UTC
        canJoin: computeCanJoin(s.startTime, s.endTime, 5),
        noShowStatus: s.noShowStatus || "none",
      };
    });

    // ✅ persist status changes safely
    for (const u of updates) {
      await Request.findByIdAndUpdate(u.id, { status: u.status });
    }


    res.json(formatted);
  } catch (err) {
    console.error("GET UPCOMING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/requests/:id/join
router.post("/:id/join", auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ success: false, message: "Session not found" });

    // Verify caller is participant
    const isStudent = req.user.role === "student" && String(request.studentId) === String(req.user.id);
    let isMentor = false;
    if (req.user.role === "mentor") {
      const mentorProfile = await MentorProfile.findById(request.mentorId).populate({ path: "user", model: "User", select: "_id" }).lean();
      isMentor = mentorProfile?.user?._id && String(mentorProfile.user._id) === String(req.user.id);
    }
    if (!isStudent && !isMentor) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Rate limit: max 3 join events per minute per user per session, based on stored events
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const current = await Request.findById(req.params.id);
    const recentCount = (current.joinEvents || []).filter(
      (e) => String(e.userId) === String(req.user.id) && e.joinedAt && new Date(e.joinedAt) >= oneMinuteAgo
    ).length;
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, message: "Rate limit exceeded. Try again in a minute." });
    }

    // Append audit event
    current.joinEvents = current.joinEvents || [];
    current.joinEvents.push({
      userId: req.user.id,
      role: isMentor ? "mentor" : "student",
      joinedAt: now,
      source: "button",
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });

    // Convenience flags
    if (isMentor) current.mentorJoined = true;
    if (isStudent) current.studentJoined = true;

    if (!current.firstJoinAt) current.firstJoinAt = now;
    current.lastJoinAt = now;

    await current.save();

    // notify both via socket
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(String(current.studentId)).emit("session:update", current._id);
        io.to(String(current.mentorId)).emit("session:update", current._id);
      }
    } catch {}

    res.json({ success: true });
  } catch (err) {
    console.error("JOIN track error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// PATCH /api/requests/mentor/:id/meeting-link
router.patch("/mentor/:id/meeting-link", auth, async (req, res) => {
  try {
    if (req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only mentors allowed" });
    }

    const { meetingLink } = req.body;

    if (
      !meetingLink ||
      !/^https:\/\/meet\.google\.com\/[a-z-]+$/i.test(meetingLink)
    ) {
      return res.status(400).json({ message: "Invalid Google Meet link" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Session not found" });
    }

    request.meetingLink = meetingLink;
    await request.save();

    res.json({ success: true, meetingLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save meeting link" });
  }
});

/* ============================
   AI: GENERATE REQUEST DRAFT
============================ */
router.post("/ai/draft", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can use AI draft." });
    }

    // rate limit per user
    const ok = checkRateLimit(req.user.id, 5, 60 * 1000);
    if (!ok) {
      return res.status(429).json({ message: "You're asking too fast, please wait." });
    }

    const { mentorId, slot, objectives, proficiency, language, notes } = req.body || {};

    // validate input
    if (!mentorId || typeof mentorId !== "string") {
      return res.status(400).json({ message: "mentorId is required." });
    }
    const day = slot?.day; const from = slot?.from; const to = slot?.to;
    if (!slot || !day || !from || !to) {
      return res.status(400).json({ message: "slot requires day, from, to." });
    }

    const allowedObjectives = [
      "career_development",
      "interview_preparation",
      "skill_improvement",
      "project_development",
    ];
    const cleanObjectives = Array.isArray(objectives)
      ? objectives.filter((o) => allowedObjectives.includes(o))
      : [];

    const allowedProficiency = ["beginner", "intermediate", "advanced"];
    if (!allowedProficiency.includes(proficiency)) {
      return res.status(400).json({ message: "Invalid proficiency." });
    }

    const lang = language === "so" ? "so" : "en";

    // Optionally fetch mentor public info (kept safe)
    let mentorPublic = null;
    try {
      mentorPublic = await MentorProfile.findById(mentorId)
        .select("expertiseAreas institution")
        .lean();
    } catch {}

    // Generate draft (Gemini if configured, else safe fallback)
    const draft = await generateRequestDraft({
      mentorPublic,
      slot: { day, from, to },
      objectives: cleanObjectives,
      proficiency,
      language: lang,
      notes: typeof notes === "string" ? notes : "",
    });

    // Strict JSON only
    return res.json(draft);
  } catch (err) {
    console.error("AI DRAFT ERROR:", err);
    // Return safe fallback JSON if something unexpected happens
    return res.status(200).json({
      motivationStatement: "I’m seeking mentorship to improve my skills and achieve clear outcomes aligned with my current proficiency.",
      sessionGoal: "Define a practical pathway for the selected objectives and set measurable targets for the next session.",
      goals: ["skill_improvement"],
      suggestedQuestions: [
        "Which foundational topics should I prioritize?",
        "What realistic outcomes can we target in this session?",
      ],
    });
  }
});


/* ============================
   DELETE / CANCEL OR REMOVE REQUEST
============================ */
router.delete("/:id", auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    // Ensure student owns the request
    if (request.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to modify this request." });
    }

    // ✅ Allow deleting if pending OR rejected
    if (request.status !== "pending" && request.status !== "rejected") {
      return res
        .status(400)
        .json({ message: "Only pending or rejected requests can be deleted." });
    }

    await request.deleteOne();
    // Notify mentor that the request was cancelled/removed
    try {
      const io = req.app.get("io");
      if (io) {
        const mentorProfile = await MentorProfile.findById(request.mentorId).populate({ path: "user", model: "User", select: "_id" }).lean();
        const mentorUserId = mentorProfile?.user?._id;
        if (mentorUserId) {
          io.to(String(mentorUserId)).emit("notification", {
            type: "request:cancelled",
            requestId: request._id,
            studentId: request.studentId,
          });
        }
      }
    } catch (err) {
      console.error("Failed to emit socket notification (request:deleted):", err);
    }

    res.json({ message: "Request removed successfully." });
  } catch (err) {
    console.error("DELETE REQUEST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
