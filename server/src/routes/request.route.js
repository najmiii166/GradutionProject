// server/src/routes/request.route.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Request from "../models/Request.js";
import MentorProfile from "../models/MentorProfile.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { finalizeSession } from "../utils/finalizeSession.js";


const router = express.Router();

/* ============================
   CREATE REQUEST (STUDENT)
============================ */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can send requests." });
    }

    const studentId = req.user.id;
    const { mentorId, slot, questionnaire } = req.body;


    if (!mentorId || !slot) {
      return res.status(400).json({ message: "Missing mentor or slot." });
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
    const exists = await Request.findOne({
      studentId,
      mentorId,
      status: { $in: ["pending", "upcoming", "ongoing"] },
    });

    if (exists) {
      return res.status(400).json({
        message: "You already have a pending or upcoming request with this mentor.",
      });
    }

    const newReq = await Request.create({
      studentId,
      mentorId,
      slot,
      questionnaire,
      status: "pending",
      requestedAt: new Date(),
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
        return { ...r, status: newStatus };
      }

      return r;
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
  const request = await Request.findById(req.params.id);
  if (!request) return res.sendStatus(404);

  if (req.user.role === "mentor") request.mentorJoined = true;
  if (req.user.role === "student") request.studentJoined = true;

  await request.save();

  // notify both via socket
  const io = req.app.get("io");
  io.to(String(request.studentId)).emit("session:update", request._id);
  io.to(String(request.mentorId)).emit("session:update", request._id);

  res.json({ success: true });
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
