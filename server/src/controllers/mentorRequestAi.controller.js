import Request from "../models/Request.js";
import MentorProfile from "../models/MentorProfile.js";
import { analyzeRequestWithGemini } from "../services/mentorRequestAi.service.js";

function pickSafeFields(reqDoc) {
  const q = reqDoc?.questionnaire || {};
  const requestText = q.reason || reqDoc?.note || "";
  const subject = Array.isArray(q.goals) && q.goals.length ? q.goals[0] : "";
  const studentGoal = q.sessionGoal || (Array.isArray(q.goals) ? q.goals.join(", ") : "");
  return { requestText, subject, studentGoal };
}

export async function analyzeMentorRequestAI(req, res) {
  try {
    const requestId = req.params.requestId;
    if (!requestId) return res.status(400).json({ success: false, message: "Missing requestId" });

    const reqDoc = await Request.findById(requestId).lean();
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    // Ensure the calling mentor owns this request
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id }).lean();
    if (!mentorProfile) return res.status(403).json({ success: false, message: "Mentor profile not found" });
    if (String(reqDoc.mentorId) !== String(mentorProfile._id)) {
      return res.status(403).json({ success: false, message: "Not authorized for this request" });
    }

    const payload = pickSafeFields(reqDoc);
    const data = await analyzeRequestWithGemini(payload);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("analyzeMentorRequestAI error:", err);
    // Robust error handling with safe fallback
    try {
      const reqDoc = await Request.findById(req.params.requestId).lean();
      const payload = pickSafeFields(reqDoc || {});
      const data = await analyzeRequestWithGemini(payload);
      return res.json({ success: true, data });
    } catch (_e) {
      return res.status(500).json({ success: false, message: "Failed to analyze request" });
    }
  }
}

export default {
  analyzeMentorRequestAI,
};
