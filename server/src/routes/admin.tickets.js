import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// List tickets
router.get('/tickets', auth, requireRole('admin'), async (req, res) => {
  try {
    const { source } = req.query || {};
    const filter = {};
    if (source === 'public') filter.source = 'public';
    if (source === 'app') filter.source = 'app';
    const tickets = await Ticket.find(filter).populate('user', 'fullName email role profileImageUrl').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('List tickets error:', err);
    return res.status(500).json({ message: 'Failed to list tickets' });
  }
});

// Update ticket status
router.patch('/tickets/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['open', 'resolved', 'closed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket not found' });
    t.status = status;
    await t.save();
    return res.json({ success: true, ticket: t });
  } catch (err) {
    console.error('Update ticket error:', err);
    return res.status(500).json({ message: 'Failed to update ticket' });
  }
});

export default router;
