import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
console.log("API_URL from env =", API_URL); // <-- TEMP: must show in the browser console

export const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}
