// server/src/services/aiDraft.service.js
// Generates a safe mentorship request draft. Uses Gemini if configured; falls back otherwise.

export async function generateRequestDraft({ mentorPublic, slot, objectives, proficiency, language, notes }) {
  // Try Gemini first if configured
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (apiKey) {
    try {
      const mod = await import("@google/generative-ai");
      const { GoogleGenerativeAI } = mod;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = buildPrompt({ mentorPublic, slot, objectives, proficiency, language, notes });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "";
      const parsed = safeParseJson(text);
      if (parsed) return normalizeGoals(parsed);
    } catch (e) {
      // fall through to template fallback
      // console.warn("Gemini draft generation failed, using fallback:", e);
    }
  }

  // Fallback template-based draft
  const fallback = buildFallbackDraft({ mentorPublic, slot, objectives, proficiency, language, notes });
  return fallback;
}

function buildPrompt({ mentorPublic, slot, objectives, proficiency, language, notes }) {
  const langLine = language === "so" ? "Somali" : "English";
  const objList = (objectives || []).join(", ");
  const mentorInfo = mentorPublic ? `Mentor expertise areas: ${(mentorPublic.expertiseAreas || []).join(', ')}; Institution: ${mentorPublic.institution || 'Independent'}.` : "Mentor public info not provided.";
  return `You are drafting a mentorship request. Return STRICT JSON ONLY with keys: motivationStatement, sessionGoal, goals, suggestedQuestions. Language: ${langLine}.
Inputs:
- Slot: ${slot?.day || ''} from ${slot?.from || ''} to ${slot?.to || ''}
- Objectives: ${objList}
- Proficiency: ${proficiency}
- Notes: ${notes || ''}
- ${mentorInfo}
Constraints:
- Do not invent personal facts.
- goals must be an array of these exact keys when applicable: career_development, interview_preparation, skill_improvement, project_development.
- suggestedQuestions: 3-5 short items.
- Keep motivationStatement concise and mentor-friendly.
Output: STRICT JSON ONLY.`;
}

function safeParseJson(text) {
  try {
    const trimmed = text.trim();
    // If model wrapped JSON in code fences, strip them
    const jsonStr = trimmed.replace(/^```json\n?|```$/g, "");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function normalizeGoals(obj) {
  const allowed = ["career_development", "interview_preparation", "skill_improvement", "project_development"];
  const out = { ...obj };
  out.goals = Array.isArray(obj.goals) ? obj.goals.filter((g) => allowed.includes(g)) : [];
  // Basic guardrails for required fields
  if (typeof out.motivationStatement !== "string") out.motivationStatement = "";
  if (typeof out.sessionGoal !== "string") out.sessionGoal = "";
  if (!Array.isArray(out.suggestedQuestions)) out.suggestedQuestions = [];
  return out;
}

function buildFallbackDraft({ mentorPublic, slot, objectives, proficiency, language, notes }) {
  const allowed = ["career_development", "interview_preparation", "skill_improvement", "project_development"];
  const goals = (objectives || []).filter((g) => allowed.includes(g));
  const lang = language === "so" ? "so" : "en";

  const day = slot?.day || "";
  const from = slot?.from || "";
  const to = slot?.to || "";

  if (lang === "so") {
    return {
      motivationStatement: `Waxaan doonayaa kaalmo hagid si aan u horumariyo xirfadahayga iyo ujeeddooyinkayga. Fadhiga ${day} (${from}–${to}) waxaan diiradda saari doonaa waxyaabaha igu habboon heerkeyga (${proficiency}). ${notes ? notes : ''}`.trim(),
      sessionGoal: `Inaan sameyno qorshe hawleed cad oo gaaban, isla markaana aan qeexno natiijooyin la cabbiri karo ka hor dhamaadka fadhiga.`,
      goals: goals.length ? goals : ["skill_improvement"],
      suggestedQuestions: [
        "Waa maxay mowduucyada aasaasiga ah ee aan mudnaanta siiyo?",
        "Sidee u qeexnaa natiijooyinka la gaari karo fadhigan?",
        "Maxay yihiin qalabka/ilaha ku habboon heerkeyga?",
      ],
    };
  }

  return {
    motivationStatement: `I’m seeking structured mentorship to align my skills and goals. In the ${day} session (${from}–${to}), I’d like to focus on practical steps suited to my ${proficiency} level. ${notes ? notes : ''}`.trim(),
    sessionGoal: `Establish a clear, realistic plan and define measurable outcomes to target before the session ends.`,
    goals: goals.length ? goals : ["skill_improvement"],
    suggestedQuestions: [
      "Which foundational topics should I prioritize?",
      "What outcomes are realistic for this session?",
      "Which resources or tools best fit my level?",
    ],
  };
}
