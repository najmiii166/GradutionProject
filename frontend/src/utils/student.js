export function getInitials(name = "") {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export function formatSessionInfo(r) {
  // Prefer explicit start/end timestamps (absolute date + times)
  if (r?.startTime && r?.endTime) {
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

  // Fallback: if only a slot (day/from/to) is available, show that
  if (r?.slot) {
    const day = r.slot.day || "";
    const from = r.slot.from || "";
    const to = r.slot.to || "";
    return `${day} ${from} – ${to}`.trim();
  }

  return "";
}
