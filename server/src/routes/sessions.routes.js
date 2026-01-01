import express from 'express';
import Request from '../models/Request.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// GET /api/sessions/mentor/:id
router.get('/mentor/:id', auth, async (req, res) => {
  try {
    const mentorId = req.params.id;

    // only allow admin or the mentor themself
    if (req.user.role !== 'admin' && String(req.user.id) !== String(mentorId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const now = new Date();

    // fetch sessions for mentor
    const sessions = await Request.find({ mentorId }).sort({ startTime: 1 }).lean();

    // Update status based on current time where applicable
    const toUpdate = [];
    const result = sessions.map((s) => {
      const updated = { ...s };
      if (s.startTime && s.endTime) {
        const st = new Date(s.startTime);
        const et = new Date(s.endTime);
        if (now >= st && now <= et) {
          if (s.status !== 'ongoing') toUpdate.push({ id: s._id, status: 'ongoing' });
          updated.status = 'ongoing';
        } else if (now > et) {
          if (s.status !== 'completed') toUpdate.push({ id: s._id, status: 'completed' });
          updated.status = 'completed';
        } else if (now < st) {
          if (s.status !== 'scheduled') toUpdate.push({ id: s._id, status: 'scheduled' });
          updated.status = 'scheduled';
        }
      }
      return updated;
    });

    // Persist status updates (fire-and-forget)
    if (toUpdate.length) {
      for (const u of toUpdate) {
        try {
          await Request.findByIdAndUpdate(u.id, { status: u.status });
        } catch (e) {
          console.error('Failed to update session status', u, e);
        }
      }
    }

    return res.json({ success: true, sessions: result });
  } catch (err) {
    console.error('Sessions fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

export default router;
