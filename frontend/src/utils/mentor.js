export function getInitials(name = "") {
  const p = name.trim().split(" ");
  return (p[0]?.[0] || "") + (p[1]?.[0] || "");
}
