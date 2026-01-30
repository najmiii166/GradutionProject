const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function buildIdCardSrc(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;
  return `${API_ROOT}${url}`;
}
