// server/src/utils/finalizeSession.js

/**
 * Decides the correct session status based on time & join flags
 */
export function finalizeSession(session, now = new Date()) {
  if (!session.startTime || !session.endTime) {
    return session.status;
  }

  const start = new Date(session.startTime);
  const end = new Date(session.endTime);

  // Before start
  if (now < start) {
    return "upcoming";
  }

  // During session
  if (now >= start && now <= end) {
    return "ongoing";
  }

  // After session end
  const mentorJoined = session.mentorJoined === true;
  const studentJoined = session.studentJoined === true;

  if (mentorJoined && studentJoined) {
    return "completed";
  }

  return "expired";
}
