// server/src/jobs/finalizeSessions.job.js
import Request from "../models/Request.js";
import { finalizeSession } from "../utils/finalizeSession.js";

export async function finalizeSessionsJob() {
  

  const sessions = await Request.find({
    status: { $in: ["upcoming", "ongoing"] },
    startTime: { $exists: true },
    endTime: { $exists: true },
  });

  const now = new Date();

  for (const s of sessions) {
    const newStatus = finalizeSession(s, now);
    if (newStatus !== s.status) {
      console.log(
        `[JOB] ${s._id} ${s.status} → ${newStatus}`
      );
      s.status = newStatus;
      // Compute no-show status when ending (completed or expired)
      if (newStatus === "completed" || newStatus === "expired") {
        const mentorJoined = s.mentorJoined === true;
        const studentJoined = s.studentJoined === true;
        if (mentorJoined && studentJoined) s.noShowStatus = "none";
        else if (mentorJoined && !studentJoined) s.noShowStatus = "student_no_show";
        else if (!mentorJoined && studentJoined) s.noShowStatus = "mentor_no_show";
        else s.noShowStatus = "both_no_show";
      }
      await s.save();
    }
  }
}
