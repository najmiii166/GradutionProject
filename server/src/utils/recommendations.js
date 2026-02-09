// server/src/utils/recommendations.js
// Rule-based mentor recommendation utility
// No external APIs. ESM, safe defaults, and defensive guards.

import MentorProfile from "../models/MentorProfile.js";
import StudentProfile from "../models/StudentProfile.js";

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
        const day = String(item.day || "").trim().toLowerCase();
        const from = String(item.from || "").trim().toLowerCase();
        const to = String(item.to || "").trim().toLowerCase();
        // Prefer a few canonical tokens to maximize matching chances
        if (day) out.push(day);
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
      const from = String(slot.from || "").trim();
      const to = String(slot.to || "").trim();
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
 * @returns {Promise<Array<{ mentorId: string, score: number, reasons: string[] }>>}
 */
export async function recommendMentors({ studentId, limit = 3 } = {}) {
  const safeLimit = Math.max(1, Number(limit) || 3);

  // Fetch student profile by user id (per project conventions)
  const student = await StudentProfile.findOne({ user: studentId }).lean().catch(() => null);
  const { skills: studentSkills } = student
    ? extractStudentPreferences(student)
    : { skills: [], preferredTimeSlots: [], goal: "" };

  // Fetch mentors. If verification/active fields exist on profile, filter; otherwise fetch all.
  // MentorProfile schema in this project doesn't include status/active flags, so fetch all.
  const mentors = await MentorProfile.find({}).lean().catch(() => []);

  const totalStudentSkills = Math.max(1, (studentSkills || []).length);

  // Prepare mentors and compute max number of time slots among them
  const prepared = (mentors || []).map((m) => {
    const attrs = extractMentorAttributes(m);
    return { m, ...attrs };
  });
  const maxSlots = Math.max(0, ...prepared.map((p) => (Array.isArray(p.rawSlots) ? p.rawSlots.length : 0)));

  const scored = prepared.map(({ m, expertise, rawSlots, rating }) => {
    const slotsCount = Array.isArray(rawSlots) ? rawSlots.length : 0;
    const skillOverlap = overlapCount(studentSkills, expertise);

    const skillMatch = skillOverlap / totalStudentSkills; // 0..1
    const availabilityScore = maxSlots > 0 ? Math.min(1, slotsCount / maxSlots) : 0; // 0..1
    const ratingScore = (Number.isFinite(rating) ? rating : 3) / 5; // 0..1

    const score = (skillMatch * 0.5) + (availabilityScore * 0.3) + (ratingScore * 0.2);

    const mentorId = (m && (m.user || m._id)) ? String(m.user || m._id) : "";
    const ratingDisplay = Number.isFinite(rating) ? Math.round(rating * 10) / 10 : 3;

    const availabilityPreview = (Array.isArray(rawSlots) ? rawSlots : [])
      .map(formatSlot)
      .filter(Boolean)
      .slice(0, 5);

    const reasons = [
      `Skill match: ${skillOverlap} overlapping skills`,
      availabilityPreview.length
        ? `Availability: ${availabilityPreview.join(", ")}`
        : "Availability: not set",
      `Rating: ${ratingDisplay}/5`,
    ];

    return { mentorId, score, reasons, availabilityPreview, availabilityCount: slotsCount };
  });

  // Sort by score desc and slice to limit
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, safeLimit);
}
