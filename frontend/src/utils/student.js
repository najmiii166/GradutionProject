export function getInitials(name = "") {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export function formatSessionInfo(r) {
  if (!r?.startTime || !r?.endTime) return "";

  const date = new Date(r.startTime).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const from = new Date(r.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const to = new Date(r.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} • ${from} – ${to}`;
}
