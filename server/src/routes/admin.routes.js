// server/src/routes/admin.routes.js

import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import MentorProfile from "../models/MentorProfile.js";
import Report from "../models/Report.js";
import Request from "../models/Request.js";
import { getGlobalMetrics, safeAggregate } from "../utils/metrics.js";
import mongoose from 'mongoose';
import { sendUserApprovedEmail, sendUserRejectedEmail, sendUserUnverifiedEmail } from "../services/mailer.js";

const router = express.Router();

// ================== REPORTS / MENTOR SUMMARIES ==================
router.get('/reports/mentors', auth, requireRole('admin'), async (req, res) => {
  try {
    const top = parseInt(req.query.top || '5', 10);
    const full = req.query.full === '1' || req.query.full === 'true';

    // Top universities where mentors registered (by MentorProfile.institution)
    const mentorUniversities = await safeAggregate(MentorProfile, [
      { $group: { _id: '$institution', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      ...(full ? [] : [{ $limit: top }]),
    ]);

    // Top mentors by average rating (use MentorProfile.averageRating) - join user for name
    const topByRatingAgg = await safeAggregate(MentorProfile, [
      { $match: { } },
      { $project: { user: 1, averageRating: 1, totalRatings: 1 } },
      { $sort: { averageRating: -1, totalRatings: -1 } },
      ...(full ? [] : [{ $limit: top }]),
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      { $project: { mentorId: '$user', averageRating: 1, totalRatings: 1, name: '$userInfo.fullName', email: '$userInfo.email' } }
    ]);

    // Top mentors by accepted requests
    const topByAcceptedAgg = await safeAggregate(Request, [
      { $match: { status: 'accepted' } },
      { $group: { _id: '$mentorId', accepted: { $sum: 1 } } },
      { $sort: { accepted: -1 } },
      ...(full ? [] : [{ $limit: top }]),
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'mentor' } },
      { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
      { $project: { mentorId: '$_id', accepted: 1, name: '$mentor.fullName', email: '$mentor.email' } }
    ]);

    return res.json({
      mentorUniversities,
      topByRating: topByRatingAgg,
      topByAccepted: topByAcceptedAgg,
    });
  } catch (err) {
    console.error('Mentor reports error:', err);
    return res.status(500).json({ message: 'Failed to compute mentor reports' });
  }
});

// ================== UNIVERSITY STUDENT-TO-MENTOR RATIO ==================
router.get('/reports/university-ratios', auth, requireRole('admin'), async (req, res) => {
  try {
    // Count students per university (only verified students)
    const studentCounts = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$university', students: { $sum: 1 } } }
    ]).allowDiskUse(true);

    // Count mentors per institution
    const mentorCounts = await MentorProfile.aggregate([
      { $group: { _id: '$institution', mentors: { $sum: 1 } } }
    ]).allowDiskUse(true);

    // Merge results
    const mapMentors = new Map(mentorCounts.map(m => [String(m._id || ''), m.mentors]));
    const rows = studentCounts.map(s => {
      const uni = String(s._id || '');
      const students = s.students || 0;
      const mentors = mapMentors.get(uni) || 0;
      const ratio = mentors === 0 ? null : +(students / mentors).toFixed(2);
      return { university: uni || '—', students, mentors, ratio };
    });

    // Also include mentor-only institutions that had no students
    for (const m of mentorCounts) {
      const uni = String(m._id || '');
      if (!rows.find(r => String(r.university) === uni)) {
        rows.push({ university: uni || '—', students: 0, mentors: m.mentors || 0, ratio: null });
      }
    }

    // sort by ratio descending, treat null as Infinity last
    rows.sort((a, b) => {
      if (a.ratio === null && b.ratio === null) return 0;
      if (a.ratio === null) return 1;
      if (b.ratio === null) return -1;
      return b.ratio - a.ratio;
    });

    return res.json({ rows });
  } catch (err) {
    console.error('University ratios error:', err);
    return res.status(500).json({ message: 'Failed to compute university ratios' });
  }
});

// ================== DRILLDOWN: MENTORS (date-scoped) ==================
router.get('/reports/drilldown/mentors', auth, requireRole('admin'), async (req, res) => {
  try {
    const { start, end, top = '5', type } = req.query;
    const topN = parseInt(top, 10) || 5;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;

    // Helper to test createdAt ranges for user or request/rating createdAt
    const inRangeMatch = (field) => {
      const m = {};
      if (s) m.$gte = s;
      if (e) m.$lte = e;
      return Object.keys(m).length ? { [field]: m } : null;
    };

    if (type === 'topMentorsByRating') {
      // Average rating per mentor but only consider ratings within date range
      const pipeline = [];
      pipeline.push({ $unwind: '$ratings' });
      if (s || e) pipeline.push({ $match: inRangeMatch('ratings.createdAt') || {} });
      pipeline.push({ $group: { _id: '$user', avgScore: { $avg: '$ratings.score' }, count: { $sum: 1 } } });
      pipeline.push({ $sort: { avgScore: -1, count: -1 } });
      pipeline.push({ $limit: topN });
      pipeline.push({ $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } });
      pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });
      pipeline.push({ $project: { mentorId: '$_id', avgScore: 1, count: 1, name: '$user.fullName', email: '$user.email' } });

      const rows = await MentorProfile.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topMentorsByRating', rows });
    }

    if (type === 'topMentorsByAccepted') {
      // Count accepted requests per mentor within date range
      const match = { status: 'accepted' };
      if (s || e) match.createdAt = {};
      if (s) match.createdAt.$gte = s;
      if (e) match.createdAt.$lte = e;
      const pipeline = [
        { $match: match },
        { $group: { _id: '$mentorId', accepted: { $sum: 1 } } },
        { $sort: { accepted: -1 } },
        { $limit: topN },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'mentor' } },
        { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
        { $project: { mentorId: '$_id', accepted: 1, name: '$mentor.fullName', email: '$mentor.email' } }
      ];
      const rows = await Request.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topMentorsByAccepted', rows });
    }

    if (type === 'topMentorUniversities') {
      // Count mentors (by User.createdAt) grouped by MentorProfile.institution
      const match = { role: 'mentor' };
      if (s || e) match.createdAt = {};
      if (s) match.createdAt.$gte = s;
      if (e) match.createdAt.$lte = e;
      const pipeline = [
        { $match: match },
        { $lookup: { from: 'mentorprofiles', localField: '_id', foreignField: 'user', as: 'mentorProfile' } },
        { $unwind: { path: '$mentorProfile', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$mentorProfile.institution', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: topN }
      ];
      const rows = await User.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topMentorUniversities', rows });
    }

    if (type === 'topMentorAreas') {
      // Count expertise areas for mentors where the mentor User.createdAt is in range
      const pipeline = [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
      ];
      if (s || e) pipeline.push({ $match: inRangeMatch('user.createdAt') || {} });
      pipeline.push({ $unwind: { path: '$expertiseAreas', preserveNullAndEmptyArrays: true } });
      pipeline.push({ $group: { _id: '$expertiseAreas', count: { $sum: 1 } } });
      pipeline.push({ $sort: { count: -1 } });
      pipeline.push({ $limit: topN });
      const rows = await MentorProfile.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topMentorAreas', rows });
    }

    return res.status(400).json({ message: 'Invalid drilldown type' });
  } catch (err) {
    console.error('Mentor drilldown error:', err);
    return res.status(500).json({ message: 'Failed to compute mentor drilldown' });
  }
});

// ================== DRILLDOWN: STUDENTS (date-scoped) ==================
router.get('/reports/drilldown/students', auth, requireRole('admin'), async (req, res) => {
  try {
    const { start, end, top = '10', type } = req.query;
    const topN = parseInt(top, 10) || 10;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;

    if (type === 'topStudentUniversities') {
      const match = { role: 'student' };
      if (s || e) match.createdAt = {};
      if (s) match.createdAt.$gte = s;
      if (e) match.createdAt.$lte = e;
      const pipeline = [
        { $match: match },
        { $group: { _id: '$university', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: topN }
      ];
      const rows = await User.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topStudentUniversities', rows });
    }

    if (type === 'topStudentAreas') {
      const pipeline = [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
      ];
      if (s || e) pipeline.push({ $match: (() => { const m = {}; if (s || e) m['user.createdAt'] = {}; if (s) m['user.createdAt'].$gte = s; if (e) m['user.createdAt'].$lte = e; return Object.keys(m).length ? m : {}; })() });
      pipeline.push({ $unwind: { path: '$mentorshipAreas', preserveNullAndEmptyArrays: true } });
      pipeline.push({ $group: { _id: '$mentorshipAreas', count: { $sum: 1 } } });
      pipeline.push({ $sort: { count: -1 } });
      pipeline.push({ $limit: topN });
      const rows = await StudentProfile.aggregate(pipeline).allowDiskUse(true);
      return res.json({ type: 'topStudentAreas', rows });
    }

    return res.status(400).json({ message: 'Invalid student drilldown type' });
  } catch (err) {
    console.error('Student drilldown error:', err);
    return res.status(500).json({ message: 'Failed to compute student drilldown' });
  }
});

// ================== REPORTS / USERS (MENTORS OR STUDENTS) ==================
// Returns rows of users for table export: name, email, role, university/institution
router.get('/reports/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const roleParam = req.query.role; // 'mentor' | 'student' | 'all' | undefined
    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;
    const full = req.query.full === '1' || req.query.full === 'true';
    const limit = full ? 0 : parseInt(req.query.top || '100', 10);

    // build match object: if roleParam is 'mentor' or 'student' restrict, if 'all' or missing, don't filter by role
    const match = {};
    if (roleParam === 'mentor' || roleParam === 'student') match.role = roleParam;
    if (start || end) match.createdAt = {};
    if (start) match.createdAt.$gte = start;
    if (end) match.createdAt.$lte = end;

    const pipeline = [{ $match: match }, { $project: { fullName: 1, email: 1, role: 1, university: 1, createdAt: 1, status: 1 } }];
    // If roleParam is specified (mentor or student) we add the corresponding lookup; if not specified or 'all', include both lookups
    const doMentorLookup = !roleParam || roleParam === 'mentor' || roleParam === 'all';
    const doStudentLookup = !roleParam || roleParam === 'student' || roleParam === 'all';

    if (doMentorLookup) {
      pipeline.push({
        $lookup: {
          from: 'mentorprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'mentorProfile',
        },
      });
      pipeline.push({ $unwind: { path: '$mentorProfile', preserveNullAndEmptyArrays: true } });
      pipeline.push({ $addFields: { institution: '$mentorProfile.institution', expertiseAreas: '$mentorProfile.expertiseAreas' } });
    }

    if (doStudentLookup) {
      pipeline.push({
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'studentProfile',
        },
      });
      pipeline.push({ $unwind: { path: '$studentProfile', preserveNullAndEmptyArrays: true } });
      pipeline.push({ $addFields: { major: '$studentProfile.major', mentorshipAreas: '$studentProfile.mentorshipAreas' } });
    }

    if (limit > 0) pipeline.push({ $limit: limit });

    const rows = await User.aggregate(pipeline).allowDiskUse(true);
    // Normalize output: prefer institution (mentor) else university (student)
    // Include mentorship/expertise areas so frontend can filter by area
    const normalized = rows.map((r) => ({
      _id: r._id,
      name: r.fullName || r.name || '',
      email: r.email,
      role: r.role,
      institution: r.institution || r.university || '',
      status: r.status || 'unknown',
      createdAt: r.createdAt,
      mentorshipAreas: r.mentorshipAreas || [],
      expertiseAreas: r.expertiseAreas || [],
    }));

    return res.json({ rows: normalized, count: normalized.length });
  } catch (err) {
    console.error('Users report error:', err);
    return res.status(500).json({ message: 'Failed to compute users report' });
  }
});

// ================== COMPREHENSIVE REPORTS SUMMARY ==================
// GET /admin/reports
router.get('/reports', auth, requireRole('admin'), async (req, res) => {
  try {
    // 1) User counts by role
    const userCountsAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).allowDiskUse(true);
    const userCounts = { mentors: 0, students: 0, admins: 0 };
    userCountsAgg.forEach((r) => {
      if (r._id === 'mentor') userCounts.mentors = r.count;
      else if (r._id === 'student') userCounts.students = r.count;
      else if (r._id === 'admin') userCounts.admins = r.count;
    });

    // 2) University stats: students per university and mentors per institution
    const studentUniAgg = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$university', students: { $sum: 1 } } }
    ]).allowDiskUse(true);

    const mentorUniAgg = await MentorProfile.aggregate([
      { $group: { _id: '$institution', mentors: { $sum: 1 } } }
    ]).allowDiskUse(true);

    const uniMap = new Map();
    studentUniAgg.forEach((r) => {
      const k = String(r._id || 'other');
      uniMap.set(k, { key: k, students: r.students, mentors: 0 });
    });
    mentorUniAgg.forEach((r) => {
      const k = String(r._id || 'other');
      const prev = uniMap.get(k) || { key: k, students: 0, mentors: 0 };
      prev.mentors = r.mentors;
      uniMap.set(k, prev);
    });
    const universityStats = Array.from(uniMap.values()).map((v) => ({ ...v, total: (v.students || 0) + (v.mentors || 0) }));

    // 3) Faculty demand: group students by major and mentors by faculty
    const studentFacultyAgg = await StudentProfile.aggregate([
      { $group: { _id: '$major', students: { $sum: 1 } } }
    ]).allowDiskUse(true);
    const mentorFacultyAgg = await MentorProfile.aggregate([
      { $group: { _id: '$faculty', mentors: { $sum: 1 } } }
    ]).allowDiskUse(true);
    const facMap = new Map();
    studentFacultyAgg.forEach((r) => {
      const k = String(r._id || 'other');
      facMap.set(k, { key: k, students: r.students, mentors: 0 });
    });
    mentorFacultyAgg.forEach((r) => {
      const k = String(r._id || 'other');
      const prev = facMap.get(k) || { key: k, students: 0, mentors: 0 };
      prev.mentors = r.mentors;
      facMap.set(k, prev);
    });
    const facultyDemand = Array.from(facMap.values()).map((v) => ({ ...v, total: (v.students || 0) + (v.mentors || 0) }));

    // 4) Expertise vs Need Gap
    const mentorExpertiseAgg = await MentorProfile.aggregate([
      { $unwind: { path: '$expertiseAreas', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$expertiseAreas', mentors: { $sum: 1 } } },
      { $sort: { mentors: -1 } }
    ]).allowDiskUse(true);

    const studentNeedsAgg = await StudentProfile.aggregate([
      { $unwind: { path: '$mentorshipAreas', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$mentorshipAreas', students: { $sum: 1 } } },
      { $sort: { students: -1 } }
    ]).allowDiskUse(true);

    const areaMap = new Map();
    mentorExpertiseAgg.forEach((r) => {
      const k = String(r._id || 'other');
      areaMap.set(k, { area: k, mentors: r.mentors, students: 0 });
    });
    studentNeedsAgg.forEach((r) => {
      const k = String(r._id || 'other');
      const prev = areaMap.get(k) || { area: k, mentors: 0, students: 0 };
      prev.students = r.students;
      areaMap.set(k, prev);
    });
    const expertiseGap = Array.from(areaMap.values()).map((v) => ({ ...v, gap: (v.students || 0) - (v.mentors || 0) }));

    // 5) Match success: accepted requests
    const acceptedRequests = await Request.countDocuments({ status: 'accepted' });

    return res.json({
      userCounts,
      universityStats,
      facultyDemand,
      expertiseGap,
      matchSuccess: { acceptedRequests },
    });
  } catch (err) {
    console.error('Reports summary error:', err);
    return res.status(500).json({ message: 'Failed to compute reports summary' });
  }
});

// ================== DETAILED REPORTS (EXECUTIVE) ==================
// GET /admin/detailed-reports
router.get('/detailed-reports', auth, requireRole('admin'), async (req, res) => {
  try {
    // General statistics
    const [userCountsAgg, acceptedCount, pendingMentorsCount] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).allowDiskUse(true),
      Request.countDocuments({ status: 'accepted' }),
      User.countDocuments({ role: 'mentor', status: { $ne: 'verified' } }),
    ]);

    const totalUsers = { mentors: 0, students: 0, admins: 0 };
    userCountsAgg.forEach((r) => {
      if (r._id === 'mentor') totalUsers.mentors = r.count;
      else if (r._id === 'student') totalUsers.students = r.count;
      else if (r._id === 'admin') totalUsers.admins = r.count;
    });

    // Faculty & University analytics
    const [studentByUni, mentorByInst, studentByFaculty, mentorByFaculty] = await Promise.all([
      User.aggregate([{ $match: { role: 'student' } }, { $group: { _id: '$university', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).allowDiskUse(true),
      MentorProfile.aggregate([{ $group: { _id: '$institution', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).allowDiskUse(true),
      StudentProfile.aggregate([{ $group: { _id: '$major', count: { $sum: 1 } } }]).allowDiskUse(true),
      MentorProfile.aggregate([{ $group: { _id: '$faculty', count: { $sum: 1 } } }]).allowDiskUse(true),
    ]);

    // Combine university stats
    const uniMap = new Map();
    studentByUni.forEach((r) => uniMap.set(String(r._id || 'other'), { key: String(r._id || 'other'), students: r.count, mentors: 0 }));
    mentorByInst.forEach((r) => {
      const k = String(r._id || 'other');
      const prev = uniMap.get(k) || { key: k, students: 0, mentors: 0 };
      prev.mentors = r.count;
      uniMap.set(k, prev);
    });
    const universityStats = Array.from(uniMap.values()).map((v) => ({ ...v, total: (v.students||0) + (v.mentors||0) })).sort((a,b)=>b.total-a.total);

    // Faculty distribution
    const facMap = new Map();
    studentByFaculty.forEach((r) => facMap.set(String(r._id || 'other'), { key: String(r._id || 'other'), students: r.count, mentors: 0 }));
    mentorByFaculty.forEach((r) => {
      const k = String(r._id || 'other');
      const prev = facMap.get(k) || { key: k, students: 0, mentors: 0 };
      prev.mentors = r.count;
      facMap.set(k, prev);
    });
    const facultyDistribution = Array.from(facMap.values()).map((v)=>({ ...v, total: (v.students||0)+(v.mentors||0) }));

    // Expertise vs Need analysis
    const [mentorExpertise, studentNeeds] = await Promise.all([
      MentorProfile.aggregate([{ $unwind: { path: '$expertiseAreas', preserveNullAndEmptyArrays: false } }, { $group: { _id: '$expertiseAreas', mentors: { $sum: 1 } } }, { $sort: { mentors: -1 } }]).allowDiskUse(true),
      StudentProfile.aggregate([{ $unwind: { path: '$mentorshipAreas', preserveNullAndEmptyArrays: false } }, { $group: { _id: '$mentorshipAreas', students: { $sum: 1 } } }, { $sort: { students: -1 } }]).allowDiskUse(true),
    ]);

    const areaMap = new Map();
    mentorExpertise.forEach((r) => areaMap.set(String(r._id||'other'), { key: String(r._id||'other'), mentors: r.mentors, students: 0 }));
    studentNeeds.forEach((r) => {
      const k = String(r._1d || r._id || 'other');
      const prev = areaMap.get(k) || { key: k, mentors: 0, students: 0 };
      prev.students = r.students;
      areaMap.set(k, prev);
    });
    const expertiseComparison = Array.from(areaMap.values()).map((v)=>({ ...v, gap: (v.students||0)-(v.mentors||0) })).sort((a,b)=>b.gap-a.gap);

    // Popular skills - top 5 from students' needs
    const popularSkills = studentNeeds.slice(0,5).map((r)=>({ skill: r._id, students: r.students }));

    // average response time estimate: avg time from request.createdAt to request.acceptedAt (assumes acceptedAt exists)
    let averageResponseTime = null;
    try {
      const resp = await Request.aggregate([
        { $match: { status: 'accepted', acceptedAt: { $exists: true } } },
        { $project: { diff: { $subtract: [ '$acceptedAt', '$requestedAt' ] } } },
        { $group: { _id: null, avg: { $avg: '$diff' } } }
      ]).allowDiskUse(true);
      if (resp && resp[0] && resp[0].avg) averageResponseTime = Math.round(resp[0].avg / 1000); // seconds
    } catch (err) {
      averageResponseTime = null;
    }

    return res.json({
      general: { totalUsers, activeMatches: acceptedCount, pendingVerifications: pendingMentorsCount },
      universityStats,
      facultyDistribution,
      expertiseComparison,
      popularSkills,
      averageResponseTime,
    });
  } catch (err) {
    console.error('Detailed reports error:', err);
    return res.status(500).json({ message: 'Failed to compute detailed reports' });
  }
});

// ================== GET OVERVIEW STATS ==================
router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  try {
    const metrics = await getGlobalMetrics();
    return res.json({
      totalStudents: metrics.totalStudents,
      totalMentors: metrics.totalMentors,
      totalPending: metrics.pendingAccounts,
      pendingStudents: metrics.pendingStudents,
      pendingMentors: metrics.pendingMentors,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// ================== GET PENDING USERS ==================
router.get("/pending", auth, requireRole("admin"), async (req, res) => {
  try {
    const role = req.query.role === "mentor" ? "mentor" : "student";

    let users = [];
    if (role === 'mentor') {
      // Include mentor profile fields so frontend can display institution and other profile data
      users = await User.aggregate([
        { $match: { role: 'mentor', status: 'pending' } },
        { $sort: { createdAt: -1 } },
        { $lookup: { from: 'mentorprofiles', localField: '_id', foreignField: 'user', as: 'mentorProfile' } },
        { $unwind: { path: '$mentorProfile', preserveNullAndEmptyArrays: true } },
        { $project: { passwordHash: 0 } },
      ]).allowDiskUse(true);
    } else {
      users = await User.find({ role, status: "pending" }).sort({ createdAt: -1 }).lean();
    }

    res.json({ users });
  } catch (err) {
    console.error("Pending users error:", err);
    res.status(500).json({ message: "Failed to load pending users" });
  }
});

// ================== GET USER WITH FULL PROFILE ==================
router.get("/users/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    } else if (user.role === "mentor") {
      profile = await MentorProfile.findOne({ user: user._id }).lean();
    }

    return res.json({ user, profile });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
});

// ================== APPROVE USER ==================
router.post(
  "/users/:id/approve",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "verified", verifiedAt: new Date() },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: "User not found" });
      let emailStatus = "not-sent";

      try {
        await sendUserApprovedEmail({
          to: user.email,
          name: user.fullName,
          role: user.role,
        });
        emailStatus = "sent";
      } catch (emailErr) {
        console.error("Approve user email error:", emailErr);
        emailStatus = "failed";
      }

      res.json({ message: "User approved", user, emailStatus });
    } catch (err) {
      console.error("Approve user error:", err);
      res.status(500).json({ message: "Failed to approve user" });
    }
  }
);

// ================== UNVERIFY USER ==================
router.post(
  "/users/:id/unverify",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const reason = (req.body?.reason || "").trim();
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "unverified", verifiedAt: null },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: "User not found" });

      let emailStatus = "not-sent";
      try {
        await sendUserUnverifiedEmail({
          to: user.email,
          name: user.fullName,
          role: user.role,
          reason,
        });
        emailStatus = "sent";
      } catch (emailErr) {
        console.error("Unverify user email error:", emailErr);
        emailStatus = "failed";
      }

      res.json({ message: "User moved to unverified", user, emailStatus });
    } catch (err) {
      console.error("Unverify user error:", err);
      res.status(500).json({ message: "Failed to unverify user" });
    }
  }
);

// ================== REJECT USER ==================
router.post(
  "/users/:id/reject",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      let emailStatus = "not-sent";
      try {
        await sendUserRejectedEmail({
          to: user.email,
          name: user.fullName,
          role: user.role,
        });
        emailStatus = "sent";
      } catch (emailErr) {
        console.error("Reject user email error:", emailErr);
        emailStatus = "failed";
      }

      // Remove associated profiles before deleting the user
      if (user.role === "mentor") {
        await MentorProfile.deleteOne({ user: user._id });
      } else if (user.role === "student") {
        await StudentProfile.deleteOne({ user: user._id });
      }

      await User.deleteOne({ _id: user._id });

      res.json({ message: "User rejected and removed", emailStatus });
    } catch (err) {
      console.error("Reject user error:", err);
      res.status(500).json({ message: "Failed to reject user" });
    }
  }
);

// ================== ANALYTICS FOR CHARTS ==================
// Only data actually used in the dashboard: studentMajors & studentUniversities
router.get("/analytics", auth, requireRole("admin"), async (req, res) => {
  try {
    // Aggregate by student major (legacy) -- keep for backward compatibility
    const studentMajors = await safeAggregate(StudentProfile, [
      { $group: { _id: { $ifNull: ["$major", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate by faculty (canonical field) for Department Distribution chart
    const studentFaculties = await safeAggregate(StudentProfile, [
      { $group: { _id: { $ifNull: ["$faculty", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Universities aggregation: normalize null/empty to 'Unknown'
    const studentUniversities = await safeAggregate(User, [
      { $match: { role: "student", status: "verified" } },
      { $group: { _id: { $ifNull: ["$university", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      studentMajors,
      studentFaculties,
      studentUniversities,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

// ================== GET USERS BY STATUS (verified / unverified) ==================
router.get("/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const status = req.query.status;

    if (!["verified", "unverified"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const users = await User.find({ status }).sort({ createdAt: -1 }).lean();

    const mentorIds = users.filter((u) => u.role === 'mentor').map((u) => u._id);
    const studentIds = users.filter((u) => u.role === 'student').map((u) => u._id);

    const [mentorProfiles, studentProfiles] = await Promise.all([
      mentorIds.length ? MentorProfile.find({ user: { $in: mentorIds } }).lean() : [],
      studentIds.length ? StudentProfile.find({ user: { $in: studentIds } }).lean() : [],
    ]);

    const mentorMap = new Map(mentorProfiles.map((mp) => [String(mp.user), mp]));
    const studentMap = new Map(studentProfiles.map((sp) => [String(sp.user), sp]));

    const enriched = users.map((u) => {
      const copy = { ...u };
      if (copy.role === 'mentor') {
        copy.mentorProfile = mentorMap.get(String(copy._id)) || null;
        copy.institution = copy.mentorProfile?.institution || copy.institution || copy.university || null;
      } else if (copy.role === 'student') {
        copy.studentProfile = studentMap.get(String(copy._id)) || null;
        copy.institution = copy.studentProfile?.faculty || copy.university || null;
      }
      return copy;
    });

    res.json({ users: enriched });
  } catch (err) {
    console.error("Users by status error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});


// ================== BACKFILL REPORT TITLES (ADMIN) ==================
router.post("/reports/backfill-titles", auth, requireRole("admin"), async (req, res) => {
  try {
    const cursor = Report.find({ $or: [{ title: { $exists: false } }, { title: null }, { title: "" }] }).cursor();
    let count = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      if (!doc.title) {
        if (doc.summary) doc.title = doc.summary;
        else if (doc.generatedText) doc.title = doc.generatedText.slice(0, 120);
        else doc.title = `Report ${doc._id}`;
        await doc.save();
        count++;
      }
    }
    return res.json({ success: true, updated: count });
  } catch (err) {
    console.error("Backfill titles error:", err);
    return res.status(500).json({ message: "Failed to backfill report titles" });
  }
});

// Export router after all routes are defined (moved to file end)

// ================== METRICS DEBUG (ADMIN) ==================
router.get("/metrics-debug", auth, requireRole("admin"), async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const metrics = await getGlobalMetrics({ start: start || null, end: end || null });
    return res.json({ success: true, metrics });
  } catch (err) {
    console.error("Metrics debug error:", err);
    return res.status(500).json({ success: false, message: "Failed to compute metrics" });
  }
});



export default router;

// ================== ADMIN CLEANUP / RESET LEGACY DATA ==================
// POST /admin/cleanup-legacy?mode=soft|delete
// Body: { confirm: true }
// - soft: mark all students/mentors as pending (keeps data)
// - delete: remove all non-admin users and related profiles, messages, conversations, requests, and reports
router.post('/cleanup-legacy', auth, requireRole('admin'), async (req, res) => {
  try {
    const mode = (req.query.mode || 'soft').toString();
    const confirm = req.body?.confirm === true || req.query.confirm === 'true';
    if (!confirm) return res.status(400).json({ message: 'Confirmation required. Set { "confirm": true } in body or ?confirm=true' });

    if (mode === 'soft') {
      // Mark all students and mentors as pending and clear verifiedAt
      const result = await User.updateMany({ role: { $in: ['student', 'mentor'] } }, { $set: { status: 'pending', verifiedAt: null } });
      return res.json({ success: true, mode: 'soft', modified: result.nModified || result.modifiedCount || 0 });
    }

    if (mode === 'delete') {
      // Collect user ids for deletion (exclude admins)
      const usersToDelete = await User.find({ role: { $in: ['student', 'mentor'] } }, { _id: 1 }).lean();
      const ids = usersToDelete.map(u => u._id);

      // Delete MentorProfile and StudentProfile
      await MentorProfile.deleteMany({ user: { $in: ids } });
      await StudentProfile.deleteMany({ user: { $in: ids } });

      // Delete Requests where studentId or mentorId matches
      await Request.deleteMany({ $or: [{ studentId: { $in: ids } }, { mentorId: { $in: ids } }] });

      // Delete Conversations and Messages
      const convs = await Conversation.find({ $or: [{ mentor: { $in: ids } }, { student: { $in: ids } }] }, { _id: 1 }).lean();
      const convIds = convs.map(c => c._id);
      if (convIds.length) {
        await Message.deleteMany({ conversation: { $in: convIds } });
        await Conversation.deleteMany({ _id: { $in: convIds } });
      }

      // Delete reports authored by these users
      await Report.deleteMany({ user: { $in: ids } });

      // Finally remove the users
      const del = await User.deleteMany({ _id: { $in: ids } });

      return res.json({ success: true, mode: 'delete', usersRemoved: del.deletedCount || 0 });
    }

    return res.status(400).json({ message: 'Invalid mode. Use mode=soft or mode=delete' });
  } catch (err) {
    console.error('Cleanup legacy error:', err);
    return res.status(500).json({ message: 'Cleanup failed' });
  }
});
