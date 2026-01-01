import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';

const router = express.Router();

// Helper: compute expiry date and months remaining
function computeExpiry(enrollment) {
  const start = new Date(enrollment.startDate);
  const months = Number(enrollment.durationMonths || 0);
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + months);
  const now = new Date();
  const msRemaining = expiry - now;
  // months remaining (fractional)
  const monthsRemaining = msRemaining > 0 ? Math.floor(msRemaining / (1000 * 60 * 60 * 24 * 30)) : 0;
  return { expiryDate: expiry, monthsRemaining, isExpired: msRemaining <= 0 };
}

// GET /api/enrollments/mentor/:id -> returns { active: [], past: [] }
router.get('/mentor/:id', auth, async (req, res) => {
  try {
    const mentorId = req.params.id;
    // allow admin or the mentor themself
    if (req.user.role !== 'admin' && String(req.user.id) !== String(mentorId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const enrollments = await Enrollment.find({ mentor: mentorId }).populate('student', 'fullName email').sort({ startDate: -1 }).lean();

    const active = [];
    const past = [];

    for (const e of enrollments) {
      const comp = computeExpiry(e);
      const obj = { ...e, expiryDate: comp.expiryDate, monthsRemaining: comp.monthsRemaining };
      const effectiveActive = e.isActive && !comp.isExpired;
      if (effectiveActive) active.push(obj);
      else past.push(obj);
    }

    return res.json({ success: true, active, past });
  } catch (err) {
    console.error('Enrollments fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
});

// GET /api/enrollments/student/:id -> list enrollments for a student
router.get('/student/:id', auth, async (req, res) => {
  try {
    const studentId = req.params.id;
    if (req.user.role !== 'admin' && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const enrollments = await Enrollment.find({ student: studentId }).populate('mentor', 'fullName email').sort({ startDate: -1 }).lean();
    const mapped = enrollments.map(e => {
      const comp = computeExpiry(e);
      return { ...e, expiryDate: comp.expiryDate, monthsRemaining: comp.monthsRemaining };
    });
    return res.json({ success: true, enrollments: mapped });
  } catch (err) {
    console.error('Student enrollments fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch student enrollments' });
  }
});

// POST /api/enrollments -> create new enrollment (admin or mentor)
router.post('/', auth, async (req, res) => {
  try {
    const { student, mentor, startDate, durationMonths } = req.body || {};
    if (!student || !mentor || !startDate || !durationMonths) return res.status(400).json({ message: 'Missing fields' });

    // only admin or the mentor can create
    if (req.user.role !== 'admin' && req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'mentor' && String(req.user.id) !== String(mentor)) return res.status(403).json({ message: 'Mentors may only enroll their own students' });

    const ent = new Enrollment({ student, mentor, startDate, durationMonths, isActive: true });
    await ent.save();
    return res.status(201).json({ success: true, enrollment: ent });
  } catch (err) {
    console.error('Create enrollment error:', err);
    return res.status(500).json({ message: 'Failed to create enrollment' });
  }
});

// PATCH /api/enrollments/:id -> update enrollment (admin or mentor)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const { startDate, durationMonths, isActive } = req.body || {};
    if (startDate !== undefined) updates.startDate = startDate;
    if (durationMonths !== undefined) updates.durationMonths = durationMonths;
    if (isActive !== undefined) updates.isActive = isActive;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ message: 'Not found' });

    // only admin or the mentor associated can update
    if (req.user.role !== 'admin' && String(req.user.id) !== String(enrollment.mentor)) return res.status(403).json({ message: 'Forbidden' });

    Object.assign(enrollment, updates);
    await enrollment.save();
    return res.json({ success: true, enrollment });
  } catch (err) {
    console.error('Update enrollment error:', err);
    return res.status(500).json({ message: 'Failed to update enrollment' });
  }
});

export default router;
