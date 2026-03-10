const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function buildIdCardSrc(url) {
  if (!url) return null;
  const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";

  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;

  const protectedUrl = url.startsWith("/uploads/idcards/")
    ? `/api/users/files/idcards/${url.replace("/uploads/idcards/", "")}`
    : url;

  if (!token || !protectedUrl.startsWith("/api/users/files/idcards/")) {
    return `${API_ROOT}${protectedUrl}`;
  }

  const separator = protectedUrl.includes("?") ? "&" : "?";
  return `${API_ROOT}${protectedUrl}${separator}token=${encodeURIComponent(token)}`;
}
