// frontend/src/api/axios.js
import axios from "axios";

/*
  VITE_API_URL waa inuu noqdaa:
  https://graduationproject-production.up.railway.app
  (API-ga dhabta ah, API path la'aan)
*/

// ❌ HALKAN AYAAN KA SAARNAY /api
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/g, "");

console.log("API_URL from env =", API_URL);

// ✅ HALKAN AYAAN KU DARAY /api
export const api = axios.create({
  baseURL: API_URL + "/api",
  withCredentials: true,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Load token if exists
const storedToken = localStorage.getItem("token");
if (storedToken) {
  setAuthToken(storedToken);
}
