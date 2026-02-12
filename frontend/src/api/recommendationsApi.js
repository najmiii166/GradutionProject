import { api } from "./axios";

// GET /api/recommendations/mentors?studentId=...&limit=...&preferredDays=...
export async function getMentorRecommendations({ studentId, limit = 3, preferredDays } = {}) {
  try {
    const params = {};
    if (studentId) params.studentId = studentId;
    if (limit != null) params.limit = limit;
    if (Array.isArray(preferredDays) && preferredDays.length) {
      params.preferredDays = preferredDays;
    }

    const resp = await api.get("/recommendations/mentors", { params });
    return resp?.data?.data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "Failed to fetch mentor recommendations";
    throw new Error(message);
  }
}

export default { getMentorRecommendations };
