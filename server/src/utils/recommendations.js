// server/src/utils/recommendations.js
// Rule-based mentor recommendation utility
// No external APIs. ESM, safe defaults, and defensive guards.

import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";

// Map short day keys used in availability (Mon, Tue, ...) to full names
const DAY_KEY_TO_LABEL = {
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
};

/**
 * Normalize an input value to a flat array of lowercase, trimmed strings.
 * - Arrays of strings => trimmed lowercase
 * - Arrays of objects with time slots => derive tokens from {day, from, to}
 * - String => split by commas/semicolons
 * - Other/undefined => []
 */
export function normalizeArray(v) {
  if (!v) return [];

  // If already an array
  if (Array.isArray(v)) {
    const out = [];
    for (const item of v) {
      if (item == null) continue;
      if (typeof item === "string") {
        const s = item.trim().toLowerCase();
        if (s) out.push(s);
        continue;
      }
      // Handle time-slot-like objects: { day, from, to }
      if (typeof item === "object") {
        const rawDay = String(item.day || "").trim();
        const dayKey = rawDay.toLowerCase();
        const mappedDay = DAY_KEY_TO_LABEL[dayKey] || rawDay;
        const day = mappedDay.toLowerCase();
        const from = String(item.from || "").trim().toLowerCase();
        const to = String(item.to || "").trim().toLowerCase();
        // Prefer a few canonical tokens to maximize matching chances
        if (dayKey && DAY_KEY_TO_LABEL[dayKey]) out.push(dayKey); // e.g. "mon"
        if (day) out.push(day); // e.g. "monday"
        if (day && from && to) out.push(`${day} ${from}-${to}`);
        continue;
      }
      // Fallback to string coercion
      const s = String(item).trim().toLowerCase();
      if (s) out.push(s);
    }
    return out;
  }

  // If string, split by common separators
  if (typeof v === "string") {
    return v
      .split(/[,;\n]/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  // Fallback: try to stringify objects, else empty
  if (typeof v === "object") {
    try {
      return Object.values(v)
        .map((x) => String(x || "").trim().toLowerCase())
        .filter(Boolean);
    } catch (_e) {
      return [];
    }
  }

  return [];
}

/**
 * Count overlap between two arrays (case-insensitive).
 * Duplicates in the same array are ignored.
 */
export function overlapCount(a, b) {
  const A = new Set((a || []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean));
  const B = new Set((b || []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean));
  let count = 0;
  for (const x of A) if (B.has(x)) count += 1;
  return count;
}

/**
 * Convert a 0..1 score to an integer percentage (0..100).
 */
export function toPercent(score) {
  const s = Number.isFinite(score) ? score : 0;
  if (s <= 0) return 0;
  if (s >= 1) return 100;
  return Math.round(s * 100);
}

// Internal helper: extract skills and preferred time slots from student profile
function extractStudentPreferences(studentDoc) {
  const skillsRaw =
    (studentDoc && (studentDoc.skills || studentDoc.mentorshipAreas)) || [];

  // Derive a few tokens from major/faculty if present, for broader matching
  const derived = [];
  if (studentDoc?.major) derived.push(String(studentDoc.major));
  if (studentDoc?.faculty) derived.push(String(studentDoc.faculty));

  const skills = normalizeArray([...normalizeArray(skillsRaw), ...normalizeArray(derived)]);

  // Optional fields (may not exist on schema)
  const preferredTimeSlots = normalizeArray(studentDoc?.preferredTimeSlots || []);
  const goal = String(studentDoc?.goal || "").trim();

  return { skills, preferredTimeSlots, goal };
}

// Internal helper: extract mentor expertise and availability tokens
function extractMentorAttributes(mentorDoc) {
  const expertise = normalizeArray(mentorDoc?.expertiseAreas || mentorDoc?.expertise || []);
  // Preserve raw availability/time slots for preview and slot counts
  const rawSlots = Array.isArray(mentorDoc?.availability)
    ? mentorDoc.availability
    : Array.isArray(mentorDoc?.timeSlots)
    ? mentorDoc.timeSlots
    : [];
  const rating = Number.isFinite(mentorDoc?.averageRating)
    ? Number(mentorDoc.averageRating)
    : Number.isFinite(mentorDoc?.rating)
    ? Number(mentorDoc.rating)
    : 3; // default 3/5 if missing

  return { expertise, rawSlots, rating };
}

// Format a single slot into a user-friendly string
function formatSlot(slot) {
  if (!slot) return null;

  const formatTime12h = (value) => {
    const raw = String(value || "").trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return raw;
    const hour24 = Number(match[1]);
    const minute = match[2];
    if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) return raw;
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute} ${period}`;
  };

  try {
    if (typeof slot === "string") {
      const s = slot.trim();
      // Try parse ISO/date-like strings
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const day = days[d.getDay()];
        let h = d.getHours();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        const m = d.getMinutes();
        const mm = String(m).padStart(2, "0");
        return `${day} ${h}:${mm} ${ampm}`;
      }
      return s;
    }
    if (typeof slot === "object") {
      const day = String(slot.day || "").trim();
      const from = formatTime12h(slot.from);
      const to = formatTime12h(slot.to);
      if (day || from || to) {
        return `${day}${from ? ` ${from}` : ""}${to ? ` - ${to}` : ""}`.trim();
      }
    }
  } catch (_e) {
    // ignore and fall through
  }
  return null;
}

/**
 * Recommend mentors for a student using a deterministic rule-based score.
 * @param {Object} params
 * @param {string} params.studentId - The user id for the student (StudentProfile.user)
 * @param {number} [params.limit=3] - Max recommendations to return
 * @param {Array<string>|string} [params.preferredDays] - Days of week the student prefers (e.g. ["monday","wednesday"]) 
 * @returns {Promise<Array<{ mentorId: string, score: number, reasons: string[] }>>}
 */
export async function recommendMentors({ studentId, limit = 3, preferredDays } = {}) {
  const safeLimit = Math.max(1, Number(limit) || 3);

  // Normalize any explicit preferred days provided with the request
  const studentPreferredDays = normalizeArray(preferredDays);

  // Fetch student profile by user id (per project conventions)
  const student = await StudentProfile.findOne({ user: studentId }).lean().catch(() => null);
  const { skills: studentSkills } = student
    ? extractStudentPreferences(student)
    : { skills: [], preferredTimeSlots: [], goal: "" };

  const mentorQuery = studentSkills.length
    ? { expertiseAreas: { $in: studentSkills } }
    : {};

  // Match StudentDashboard/AllMentors behavior: only verified mentor users.
  const mentors = await MentorProfile.find(mentorQuery)
    .populate("user", "_id fullName university status role")
    .lean()
    .catch(() => []);

  const verifiedMentors = (mentors || []).filter(
    (m) => m?.user?.status === "verified" && m?.user?.role === "mentor"
  );

  const totalStudentSkills = Math.max(1, (studentSkills || []).length);

  // Prepare mentors and compute max number of time slots among them
  const prepared = verifiedMentors.map((m) => {
    const attrs = extractMentorAttributes(m);
    return { m, ...attrs };
  });
  const maxSlots = Math.max(0, ...prepared.map((p) => (Array.isArray(p.rawSlots) ? p.rawSlots.length : 0)));

  const scored = prepared.map(({ m, expertise, rawSlots, rating }) => {
    const slotsCount = Array.isArray(rawSlots) ? rawSlots.length : 0;
    const skillOverlap = overlapCount(studentSkills, expertise);

    const availabilityTokens = normalizeArray(rawSlots);
    const dayOverlap = overlapCount(studentPreferredDays, availabilityTokens);


    const skillMatch = skillOverlap / totalStudentSkills; // 0..1
    const availabilityScore = maxSlots > 0 ? Math.min(1, slotsCount / maxSlots) : 0; // 0..1
    const ratingScore = (Number.isFinite(rating) ? rating : 3) / 5; // 0..1

    const dayScore = studentPreferredDays.length
      ? Math.min(1, dayOverlap / studentPreferredDays.length)
      : 0; // 0..1

    let score;
    if (studentPreferredDays.length) {
      // If the student specified preferred days, weight them into the score
      score = (skillMatch * 0.4) + (availabilityScore * 0.2) + (dayScore * 0.3) + (ratingScore * 0.1);
    } else {
      // Original weighting when no explicit day preferences are sent
      score = (skillMatch * 0.5) + (availabilityScore * 0.3) + (ratingScore * 0.2);
    }

    const mentorId = m?._id ? String(m._id) : "";
    const fullName = String(m?.user?.fullName || "").trim();
    const university = String(m?.user?.university || m?.institution || "").trim();
    const ratingDisplay = Number.isFinite(rating) ? Math.round(rating * 10) / 10 : 3;

    const availabilityPreview = (Array.isArray(rawSlots) ? rawSlots : [])
      .map(formatSlot)
      .filter(Boolean)
      .slice(0, 5);

    const reasons = [];

    // Skill reason
    if (skillOverlap > 0) {
      // With the current student flow there is typically a single chosen area,
      // so a simpler message is clearer than "1 overlapping skills".
      reasons.push("Matches your learning goal");
    } else {
      reasons.push("Different area than your selected goal");
    }

    // Availability reason
    reasons.push(
      availabilityPreview.length
        ? `Availability: ${availabilityPreview.join(", ")}`
        : "Availability: not set"
    );

    // Rating reason
    reasons.push(`Rating: ${ratingDisplay}/5`);

    if (studentPreferredDays.length) {
      if (dayOverlap > 0) {
        reasons.push("Matches your preferred days");
      } else {
        reasons.push("Does not exactly match preferred days, but may still be suitable");
      }
    }

    return {
      mentorId,
      userId: m?.user?._id ? String(m.user._id) : "",
      fullName,
      university,
      institution: String(m?.institution || ""),
      score,
      reasons,
      availabilityPreview,
      availabilityCount: slotsCount,
    };
  });

  // Sort by score desc and slice to limit
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, safeLimit);
}
