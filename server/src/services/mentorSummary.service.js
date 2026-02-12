// server/src/services/mentorSummary.service.js
// Generates a concise AI summary for a mentorship request. Uses Gemini if configured; falls back deterministically.

export async function generateMentorSummary({ reason, goals = [], sessionGoal, experienceLevel = "beginner", slot = {}, language = "en" }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (apiKey) {
    try {
      const mod = await import("@google/generative-ai");
      const { GoogleGenerativeAI } = mod;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = buildPrompt({ reason, goals, sessionGoal, experienceLevel, slot, language });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      const parsed = safeParseJson(text);
      if (validateSummary(parsed)) return normalize(parsed, experienceLevel);
    } catch (e) {
      // fall through to deterministic fallback
    }
  }

  return fallbackSummary({ reason, goals, sessionGoal, experienceLevel, slot, language });
}

function buildPrompt({ reason, goals, sessionGoal, experienceLevel, slot, language }) {
  const safeGoals = Array.isArray(goals) ? goals.join(", ") : "";
  const slotLine = `${slot?.day || ""} ${slot?.from || ""}–${slot?.to || ""}`.trim();
  const lang = language === "so" ? "Somali" : "English";
  return `You are summarizing a mentorship request for a mentor. Return STRICT JSON ONLY with keys: summary, keyPoints, difficulty. Language: ${lang}.
Input:
- Motivation: ${sanitize(reason)}
- Goals: ${sanitize(safeGoals)}
- Session Goal: ${sanitize(sessionGoal)}
- Experience: ${experienceLevel}
- Slot: ${slotLine}
Rules:
- summary: 1–3 sentences, professional tone, clearly stating what the student wants and outcome expectations.
- difficulty must be one of: beginner|intermediate|advanced
 - keyPoints: exactly 3 concise bullets focused on student objectives/constraints
- Do NOT include emails, phone numbers, or any personal identifiers.
 Style:
 - Be clear and direct; avoid casual phrasing.
 - Emphasize objectives, session focus, and measurable outcome.
 - Use simple sentences; avoid jargon and filler.
Output: STRICT JSON ONLY.`;
}

function sanitize(t) {
  const s = String(t || "");
  return s.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]")
          .replace(/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{3,4}|\d{10,})/g, "[redacted phone]")
          .trim();
}

function safeParseJson(text) {
  try {
    const trimmed = String(text).trim();
    const jsonStr = trimmed.replace(/^```json\n?|```$/g, "");
    return JSON.parse(jsonStr);
  } catch {
    try {
      const m = String(text).match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : null;
    } catch {
      return null;
    }
  }
}

function validateSummary(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.summary !== "string") return false;
  if (!Array.isArray(obj.keyPoints) || !obj.keyPoints.every((x) => typeof x === "string")) return false;
  if (!["beginner", "intermediate", "advanced"].includes(obj.difficulty)) return false;
  return true;
}

function normalize(obj, defaultDifficulty) {
  return {
    summary: (obj.summary || "").trim().slice(0, 500),
    keyPoints: (obj.keyPoints || []).map((s) => sanitize(s)).slice(0, 3),
    difficulty: obj.difficulty || defaultDifficulty || "beginner",
  };
}

function fallbackSummary({ reason, goals = [], sessionGoal, experienceLevel, slot, language = "en" }) {
  const diff = ["beginner", "intermediate", "advanced"].includes(experienceLevel) ? experienceLevel : "beginner";
  const g = Array.isArray(goals) ? goals : [];
  const slotText = `${slot?.day || ""} ${slot?.from || ""}–${slot?.to || ""}`.trim();
  const isSo = language === "so";
  const goalsLabel = g.length ? g.map((x) => x.replace(/_/g, " ")).join(", ") : "";

  const summary = [
    (reason || "").trim()
      ? (isSo
          ? `Ardaygu wuxuu ujeeddo ka leeyahay hagid xirfadeed si loo ${sanitize(sessionGoal || reason).slice(0, 140)}.`
          : `The student requests structured mentorship to ${sanitize(sessionGoal || reason).slice(0, 140)}.`)
      : null,
    goalsLabel
      ? (isSo
          ? `Fadhigu wuxuu diiradda saari doonaa: ${goalsLabel}.`
          : `Session focus: ${goalsLabel}.`)
      : null,
    slotText
      ? (isSo ? `Waqtiga: ${slotText}.` : `Scheduled: ${slotText}.`)
      : null,
  ].filter(Boolean).join(" ");

  const keyPoints = isSo
    ? [
        g.length ? `Ujeeddooyin: ${goalsLabel}` : "Caddee ujeeddooyinka",
        sessionGoal ? "Qeex natiijo la cabbiri karo" : "Deji natiijo la gaari karo",
        `U habeey qorshaha heerka ${diff}`,
      ]
    : [
        g.length ? `Objectives: ${goalsLabel}` : "Clarify objectives",
        sessionGoal ? "Define a measurable outcome" : "Set an achievable outcome",
        `Align plan to ${diff} level`,
      ];

  return {
    summary: summary || (isSo
      ? "Ardaygu wuxuu codsanayaa hagid ku habboon heerkiisa si uu u gaaro natiijo cad inta lagu jiro waqtiga la qorsheeyay."
      : "Student requests focused guidance matching their level and aims to achieve a clear outcome in the scheduled slot."),
    keyPoints,
    difficulty: diff,
  };
}
