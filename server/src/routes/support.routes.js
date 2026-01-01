import express from 'express';
import { auth } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/support/create
router.post('/create', auth, async (req, res) => {
  try {
    const { subject, message } = req.body || {};
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });

    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).lean();
    const senderName = (user && (user.fullName || user.email)) || 'Unknown';
    const senderRole = user?.role || req.user?.role || 'student';

    const ticket = new Ticket({
      user: userId,
      senderName,
      senderRole,
      subject,
      message,
    });

    await ticket.save();

    return res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ message: 'Failed to create ticket' });
  }
});

export default router;
