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
      await s.save();
    }
  }
}
