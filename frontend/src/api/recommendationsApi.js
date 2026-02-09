import { api } from "./axios";

// GET /api/recommendations/mentors?studentId=...&limit=...
export async function getMentorRecommendations({ studentId, limit = 3 } = {}) {
  try {
    const params = {};
    if (studentId) params.studentId = studentId;
    if (limit != null) params.limit = limit;

    const resp = await api.get("/recommendations/mentors", { params });
    return resp?.data?.data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "Failed to fetch mentor recommendations";
    throw new Error(message);
  }
}

export default { getMentorRecommendations };
