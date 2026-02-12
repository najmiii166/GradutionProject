import express from 'express';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Simple IP-based rate limiter: 5 requests/hour/IP
const rateMap = new Map();
function rateOk(ip, limit = 5, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const rec = rateMap.get(ip) || { count: 0, start: now };
  if (now - rec.start > windowMs) { rec.count = 0; rec.start = now; }
  rec.count += 1;
  rateMap.set(ip, rec);
  return rec.count <= limit;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

// PUBLIC: POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Honeypot: silently accept and drop if website field is filled
    if (req.body && typeof req.body.website === 'string' && req.body.website.trim().length > 0) {
      return res.json({ success: true, message: 'Thanks! We received your message.' });
    }

    if (!rateOk(String(ip))) {
      return res.status(429).json({ success: false, message: "You're contacting us too frequently. Please wait and try again later." });
    }

    const { name, email, subject, message, priority } = req.body || {};

    // Validation
    const errors = {};
    const nm = String(name || '').trim();
    const em = String(email || '').trim();
    const sj = String(subject || '').trim();
    const ms = String(message || '').trim();
    const pr = String(priority || 'low').trim().toLowerCase();

    if (nm.length < 2 || nm.length > 60) errors.name = 'Name must be 2-60 characters';
    if (!isValidEmail(em)) errors.email = 'Invalid email';
    if (sj.length < 3 || sj.length > 100) errors.subject = 'Subject must be 3-100 characters';
    if (ms.length < 10 || ms.length > 2000) errors.message = 'Message must be 10-2000 characters';
    if (!['low', 'medium', 'high'].includes(pr)) errors.priority = 'Invalid priority';

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const ticket = new Ticket({
      source: 'public',
      senderName: nm,
      senderEmail: em,
      senderRole: 'public',
      subject: sj,
      message: ms,
      priority: pr,
      status: 'open',
    });

    await ticket.save();

    return res.json({ success: true, message: 'Thanks! We received your message.' });
  } catch (err) {
    console.error('PUBLIC CONTACT ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

export default router;
