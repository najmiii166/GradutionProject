const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function buildAvatarSrc(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) return `${API_ROOT}/${url}`;
  return `${API_ROOT}${url}`;
}
