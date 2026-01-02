// frontend/src/api/axios.js
import axios from "axios";

// Ensure there is no trailing slash on the API URL
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/g, "");
console.log("API_URL from env =", API_URL);

export const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

const storedToken = localStorage.getItem("token");
if (storedToken) {
  setAuthToken(storedToken);
}
