import { api } from "./axios";

export async function generateReport(payload) {
	try {
		const resp = await api.post("/reports/generate", payload);
		return resp;
	} catch (err) {
		// normalize error
		throw err?.response?.data || err;
	}
}

export async function getUserReports(userId) {
	try {
		// server exposes /history/:userId — keep this endpoint
		const resp = await api.get(`/reports/history/${userId}`);
		return resp;
	} catch (err) {
		throw err?.response?.data || err;
	}
}

export async function getReport(id) {
	try {
		const resp = await api.get(`/reports/view/${id}`);
		return resp;
	} catch (err) {
		throw err?.response?.data || err;
	}
}

// backward compatible alias
export const createReport = generateReport;
