const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function buildAvatarSrc(url) {
  if (!url) return "";
  // If it's already a full URL or a data/blob URL, return as-is
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  // Relative paths: join with API root
  if (!url.startsWith("/")) return `${API_ROOT}/${url}`;
  return `${API_ROOT}${url}`;
}
