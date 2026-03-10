// server/src/services/mentorSummary.service.js
// Generates a concise AI summary for a mentorship request. Uses Gemini if configured; falls back deterministically.

export async function generateMentorSummary({ reason, goals = [], sessionGoal, experienceLevel = "beginner", slot = {}, language = "en" }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (apiKey) {
    try {
      const mod = await import("@google/generative-ai");
      const { GoogleGenerativeAI } = mod;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = buildPrompt({ reason, goals, sessionGoal, experienceLevel, slot, language });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      const parsed = safeParseJson(text);
      if (validateSummary(parsed)) {
        return normalize(parsed, experienceLevel, { reason, goals, sessionGoal, language });
      }
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
- Read the student's full meaning first, then rewrite it clearly for the mentor.
- summary: 1-2 short sentences summarizing the student's motivation/background only.
- summary must NOT repeat the exact main goal text unless needed for clarity.
- difficulty must be one of: beginner|intermediate|advanced
- keyPoints: exactly 3 short bullet points.
- keyPoints[0]: the student's main goal, rewritten clearly.
- keyPoints[1]: a priority area or blocker.
- keyPoints[2]: the support level or expected outcome.
- Do NOT include emails, phone numbers, or any personal identifiers.
 Style:
- Be clear and direct; avoid casual phrasing.
- Emphasize objectives, current level, blockers, and desired outcome.
- Rewrite the wording naturally; do not copy long sentences from the student.
- Never cut a sentence in the middle.
- Keep each bullet under 12 words when possible.
- Avoid filler and repetition.
- Avoid fragments like "I am focusing" or unfinished thoughts.
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

function normalize(obj, defaultDifficulty, source = {}) {
  const fallback = fallbackSummary({
    reason: source.reason,
    goals: source.goals,
    sessionGoal: source.sessionGoal,
    experienceLevel: defaultDifficulty,
    language: source.language,
  });

  const summary = cleanSummary(obj.summary);
  const keyPoints = normalizeKeyPoints(obj.keyPoints, source);

  return {
    summary: needsFallbackSummary(summary, keyPoints, source)
      ? fallback.summary
      : summary,
    keyPoints: keyPoints.length ? keyPoints : fallback.keyPoints,
    difficulty: obj.difficulty || defaultDifficulty || "beginner",
  };
}

function fallbackSummary({ reason, goals = [], sessionGoal, experienceLevel, slot, language = "en" }) {
  const diff = ["beginner", "intermediate", "advanced"].includes(experienceLevel) ? experienceLevel : "beginner";
  const g = Array.isArray(goals) ? goals : [];
  const slotText = `${slot?.day || ""} ${slot?.from || ""}–${slot?.to || ""}`.trim();
  const isSo = language === "so";
  const goalsLabel = g.length ? g.map((x) => x.replace(/_/g, " ")).join(", ") : "";

  const summary = isSo
    ? buildSomaliFallbackSummary({ sessionGoal, reason, goalsLabel })
    : buildEnglishFallbackSummary({ sessionGoal, reason, goalsLabel });

  const keyPoints = isSo
    ? [
        buildSomaliBullet(sessionGoal, "Yoolka kulanka ha caddaado"),
        g.length ? `Mudnaanta: ${shortText(goalsLabel, 45)}` : "Mudnaanta ha la caddeeyo",
        `Qorshaha ku habee heerka ${diff}`,
      ]
    : [
        buildEnglishBullet(sessionGoal, "Clarify the main session goal"),
        g.length ? `Priority: ${shortText(goalsLabel, 45)}` : "Clarify top priorities",
        `Match guidance to ${diff} level`,
      ];

  return {
    summary: cleanSummary(summary || (isSo
      ? "Ardaygu wuxuu codsanayaa hagid ku habboon heerkiisa si uu u gaaro natiijo cad inta lagu jiro waqtiga la qorsheeyay."
      : "The student needs focused mentorship matched to their current level and intended outcome.")),
    keyPoints: normalizeKeyPoints(keyPoints),
    difficulty: diff,
  };
}

function cleanSummary(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const sentences = (raw.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) || [raw])
    .filter((sentence) => !isLowValueSentence(sentence));
  const concise = sentences.slice(0, 2).join(" ").trim();
  return concise.length > 220 ? `${concise.slice(0, 217).trim()}...` : concise;
}

function normalizeKeyPoints(points, source = {}) {
  const cleaned = (Array.isArray(points) ? points : [])
    .map((item) => String(item || "").replace(/^[•\-\*]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((item, index) => {
      const base = sanitize(item);
      if (index === 0 && source.sessionGoal) {
        return source.language === "so"
          ? buildSomaliBullet(source.sessionGoal, base)
          : buildEnglishBullet(source.sessionGoal, base);
      }
      return shortText(base, 70);
    })
    .slice(0, 3);

  return dedupeLines(cleaned);
}

function isLowValueSentence(sentence) {
  const s = String(sentence || "").trim();
  if (!s) return true;
  return /^(i am focusing|i am focused|i am|focusing|goal|objective)\b/i.test(s) || s.length < 8;
}

function needsFallbackSummary(summary, keyPoints, source = {}) {
  if (!summary) return true;
  const firstBullet = keyPoints?.[0] || "";
  if (isTooSimilar(summary, firstBullet)) return true;
  if (source.sessionGoal && isTooSimilar(summary, source.sessionGoal) && source.reason) return true;
  return false;
}

function isTooSimilar(a, b) {
  const left = comparableText(a);
  const right = comparableText(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function comparableText(text) {
  return normalizeStudentStatement(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeLines(items) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((entry) => isTooSimilar(entry, item)) === index)
    .slice(0, 3);
}

function shortText(text, max) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (value.length <= max) return value;
  const shortened = value.slice(0, max + 1);
  const safe = shortened.slice(0, shortened.lastIndexOf(" ")) || shortened.slice(0, max);
  return `${safe.trim()}...`;
}

function buildEnglishFallbackSummary({ sessionGoal, reason, goalsLabel }) {
  const cleanSessionGoal = normalizeStudentStatement(sessionGoal);
  const cleanReason = normalizeStudentStatement(reason);

  if (cleanReason) return `The student is seeking guidance ${formalizeSupportPhrase(cleanReason)}.`;
  if (goalsLabel) return `The student is looking for mentorship focused on ${shortText(goalsLabel, 90)}.`;
  if (cleanSessionGoal) return `The student wants support ${formalizeGoalPhrase(cleanSessionGoal)}.`;
  return "";
}

function buildSomaliFallbackSummary({ sessionGoal, reason, goalsLabel }) {
  const cleanSessionGoal = normalizeStudentStatement(sessionGoal);
  const cleanReason = normalizeStudentStatement(reason);

  if (cleanReason) return `Ardaygu wuxuu doonayaa hagid ku saabsan ${shortText(cleanReason, 90)}.`;
  if (goalsLabel) return `Ardaygu wuxuu doonayaa hagid diiradda saaraysa ${shortText(goalsLabel, 90)}.`;
  if (cleanSessionGoal) return `Ardaygu wuxuu doonayaa taageero si uu u gaaro ${shortText(cleanSessionGoal, 90)}.`;
  return "";
}

function buildEnglishBullet(text, fallback) {
  const cleaned = normalizeStudentStatement(text);
  return cleaned ? `Primary goal: ${shortText(capitalizeSentence(cleaned), 90)}` : fallback;
}

function buildSomaliBullet(text, fallback) {
  const cleaned = normalizeStudentStatement(text);
  return cleaned ? `Yool: ${shortText(cleaned, 55)}` : fallback;
}

function normalizeStudentStatement(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";

  return value
    .replace(/^(my\s+goal\s+is\s+to)\s+/i, "")
    .replace(/^(my\s+goal\s+is)\s+/i, "")
    .replace(/^(i\s+want\s+to)\s+/i, "")
    .replace(/^(i\s+would\s+like\s+to)\s+/i, "")
    .replace(/^(i\s+need\s+help\s+with)\s+/i, "")
    .replace(/^(i\s+need\s+to)\s+/i, "")
    .replace(/^(i\s+am\s+trying\s+to)\s+/i, "")
    .replace(/^(i\s+am\s+focused\s+on)\s+/i, "")
    .replace(/^(i\s+am\s+focusing\s+on)\s+/i, "")
    .replace(/^(i\s+am\s+working\s+on)\s+/i, "")
    .replace(/^(i\s+am\s+interested\s+in)\s+/i, "")
    .replace(/^(i\s+am\s+exploring)\s+/i, "")
    .replace(/^(i\s+am\s+learning)\s+/i, "")
    .replace(/^(i\s+am)\s+/i, "")
    .replace(/^(i\s+hope\s+to)\s+/i, "")
    .replace(/^(to)\s+/i, "")
    .replace(/\bmy\b/gi, "their")
    .replace(/\bme\b/gi, "them")
    .trim()
    .replace(/^[a-z]/, (match) => match.toLowerCase())
    .replace(/[\.;:,]+$/, "");
}

function formalizeSupportPhrase(text) {
  const value = shortText(text, 110);
  if (!value) return "";
  if (/^[a-z]+ing\b/i.test(value)) return `on ${value}`;
  if (/^(transition|move|shift|grow|improve|build|develop|learn|integrate|apply|use|strengthen)\b/i.test(value)) {
    return `to ${value}`;
  }
  return `with ${value}`;
}

function formalizeGoalPhrase(text) {
  const value = shortText(text, 110);
  if (!value) return "";
  if (/^(to)\b/i.test(value)) return value;
  return `to ${value}`;
}

function capitalizeSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
