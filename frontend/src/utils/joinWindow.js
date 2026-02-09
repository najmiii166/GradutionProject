// frontend/src/utils/joinWindow.js
// Reusable helper to enforce strict join window visibility.
// Uses ISO timestamps (UTC) parsed by Date; comparisons are epoch-based.
// If endTime is missing, falls back to startTime + 60 minutes.

/**
 * Determine if the join window is open.
 * Visible from `minutesBefore` before start until end.
 * @param {string|Date} startTime ISO string or Date
 * @param {string|Date} endTime ISO string or Date
 * @param {number} minutesBefore minutes before start when join is allowed (default 5)
 * @returns {boolean}
 */
export function isJoinWindowOpen(startTime, endTime, minutesBefore = 5) {
  if (!startTime) return false;

  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(new Date(start).getTime() + 60 * 60 * 1000);
  const now = new Date();

  // Open if: now >= start - minutesBefore AND now <= end
  const openAt = start.getTime() - minutesBefore * 60 * 1000;
  return now.getTime() >= openAt && now.getTime() <= end.getTime();
}

/**
 * Optional helper: get a simple status label relative to the window.
 * @param {string|Date} startTime
 * @param {string|Date} endTime
 * @param {number} minutesBefore
 * @returns {"before"|"open"|"ended"}
 */
export function getJoinWindowState(startTime, endTime, minutesBefore = 5) {
  if (!startTime) return "ended";
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(new Date(start).getTime() + 60 * 60 * 1000);
  const now = new Date();
  const openAt = start.getTime() - minutesBefore * 60 * 1000;
  if (now.getTime() < openAt) return "before";
  if (now.getTime() > end.getTime()) return "ended";
  return "open";
}
