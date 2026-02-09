import { GoogleGenerativeAI } from "@google/generative-ai";

const ALLOWED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const ALLOWED_DURATIONS = [30, 45, 60, 90];

function redactPII(text) {
  if (!text) return "";
  let t = String(text);
  // Remove emails
  t = t.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]");
  // Remove common phone formats
  t = t.replace(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{3,4}|\d{10,})/g, "[redacted phone]");
  // Trim and cap length
  t = t.trim().slice(0, 3000);
  return t;
}

function buildPrompt(payload) {
  const { requestText, subject, studentGoal } = payload;
  const safe = {
    requestText: redactPII(requestText),
    subject: redactPII(subject),
    studentGoal: redactPII(studentGoal),
  };

  return `You are an assistant for mentors.
Return ONLY a strict JSON object with this exact schema and keys (no markdown, no explanations):
{
  "summary": string,
  "topicTags": string[],
  "difficulty": "beginner"|"intermediate"|"advanced",
  "suggestedSession": {
     "durationMinutes": 30|45|60|90,
     "agenda": string[],
     "prepForStudent": string[]
  },
  "mentorReplyDraft": string
}

Constraints:
- Do NOT include emails, phone numbers, or any PII.
- Keep arrays to 3-6 concise items.
- Use concise, actionable language.

Input:
- Request Text: ${safe.requestText || ""}
- Subject/Topic: ${safe.subject || ""}
- Student Goal: ${safe.studentGoal || ""}`;
}

function validateOutput(obj) {
  try {
    if (!obj || typeof obj !== "object") return false;
    if (typeof obj.summary !== "string") return false;
    if (!Array.isArray(obj.topicTags) || !obj.topicTags.every((x) => typeof x === "string")) return false;
    if (!ALLOWED_DIFFICULTIES.includes(obj.difficulty)) return false;
    const ss = obj.suggestedSession;
    if (!ss || typeof ss !== "object") return false;
    if (!ALLOWED_DURATIONS.includes(ss.durationMinutes)) return false;
    if (!Array.isArray(ss.agenda) || !ss.agenda.every((x) => typeof x === "string")) return false;
    if (!Array.isArray(ss.prepForStudent) || !ss.prepForStudent.every((x) => typeof x === "string")) return false;
    if (typeof obj.mentorReplyDraft !== "string") return false;
    return true;
  } catch (_e) {
    return false;
  }
}

function fallbackResponse(payload) {
  const safeText = redactPII(payload?.requestText || "");
  const goal = redactPII(payload?.studentGoal || "");
  const subject = redactPII(payload?.subject || "");
  const summaryBase = safeText || goal || subject || "Mentor request";

  return {
    summary: summaryBase.slice(0, 240),
    topicTags: subject ? subject.split(/[,|]/).map((s) => s.trim()).filter(Boolean).slice(0, 5) : [],
    difficulty: "beginner",
    suggestedSession: {
      durationMinutes: 45,
      agenda: [
        "Clarify goals and current understanding",
        "Explain core concepts with examples",
        "Hands-on walkthrough / exercises",
        "Set follow-up tasks and next steps",
      ],
      prepForStudent: [
        "List 2-3 specific questions",
        "Share any code or notes beforehand",
        "Install required tools (if any)",
      ],
    },
    mentorReplyDraft:
      "Thanks for your request! Based on what you shared, we can focus on clarifying goals, covering the essentials, and doing a quick hands-on walkthrough. Please share any materials in advance so we can tailor the session.",
  };
}

export async function analyzeRequestWithGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // No API key → return fallback immediately
    return fallbackResponse(payload);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = buildPrompt(payload);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (response?.text?.() || "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_e) {
      // Attempt to extract JSON block if model added extra text
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!validateOutput(parsed)) {
      return fallbackResponse(payload);
    }

    // Extra safety: re-redact any PII that might have slipped in
    parsed.summary = redactPII(parsed.summary);
    parsed.mentorReplyDraft = redactPII(parsed.mentorReplyDraft);
    parsed.topicTags = (parsed.topicTags || []).map((t) => redactPII(t)).filter(Boolean);
    parsed.suggestedSession.agenda = (parsed.suggestedSession.agenda || []).map((t) => redactPII(t)).filter(Boolean);
    parsed.suggestedSession.prepForStudent = (parsed.suggestedSession.prepForStudent || []).map((t) => redactPII(t)).filter(Boolean);

    return parsed;
  } catch (err) {
    console.error("Gemini AI analysis error:", err);
    return fallbackResponse(payload);
  }
}

export default {
  analyzeRequestWithGemini,
};
