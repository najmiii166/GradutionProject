import mongoose from "mongoose";
import User from "../models/User.js";
import Request from "../models/Request.js";
import StudentProfile from "../models/StudentProfile.js";
import MentorProfile from "../models/MentorProfile.js";

// Helper: robust aggregate that works whether model.aggregate exists or not
export async function safeAggregate(model, pipeline = []) {
  if (!model) throw new Error("Model is required for aggregation");
  // If model has mongoose-style aggregate, use it
  if (model && typeof model.aggregate === "function") {
    // Mongoose model aggregate
    try {
      const result = model.aggregate(pipeline);
      // some mongoose versions return thenable
      if (result.exec) return await result.exec();
      return await result;
    } catch (e) {
      // fall through to collection method
    }
  }
  // Try using the model.collection.aggregate if available
  try {
    if (model && model.collection && typeof model.collection.aggregate === "function") {
      const cursor = model.collection.aggregate(pipeline);
      if (cursor && typeof cursor.toArray === "function") return await cursor.toArray();
      return await cursor;
    }

    // Last resort: use mongoose connection to get the collection by name
    const collName = (model && model.collection && model.collection.name) || (model && model.modelName);
    if (collName && mongoose?.connection?.db) {
      const dbColl = mongoose.connection.db.collection(collName);
      if (dbColl && typeof dbColl.aggregate === "function") {
        const cursor = dbColl.aggregate(pipeline);
        if (cursor && typeof cursor.toArray === "function") return await cursor.toArray();
        return await cursor;
      }
    }
  } catch (err) {
    const modelName = model && model.modelName ? model.modelName : String((model && model.collection && model.collection.name) || '(unknown)');
    console.error(`safeAggregate: aggregate attempt failed for model=${modelName}`, { pipeline, error: err?.message || err });
    // Degrade gracefully: return empty array so callers can continue and we can inspect logs
    return [];
  }
}

// Build createdAt/requestedAt filter object for mongoose queries
export function buildDateFilter(start, end) {
  const filter = {};
  if (start) filter.$gte = new Date(start);
  if (end) filter.$lte = new Date(end);
  return Object.keys(filter).length ? filter : null;
}

// Compute global metrics. If start/end provided, applies createdAt filter to users
// and requestedAt filter to requests.
export async function getGlobalMetrics({ start = null, end = null } = {}) {
  const createdAt = buildDateFilter(start, end);
  const requestedAt = buildDateFilter(start, end);

  const userCreatedFilter = createdAt ? { createdAt } : {};
  const requestDateFilter = requestedAt ? { requestedAt: requestedAt } : {};

  const [totalStudents, totalMentors, pendingStudents, pendingMentors, completedSessions, pendingRequests] =
    await Promise.all([
      User.countDocuments({ role: "student", status: "verified", ...userCreatedFilter }),
      User.countDocuments({ role: "mentor", status: "verified", ...userCreatedFilter }),
      User.countDocuments({ role: "student", status: "pending", ...userCreatedFilter }),
      User.countDocuments({ role: "mentor", status: "pending", ...userCreatedFilter }),
      Request.countDocuments({ status: "completed", ...requestDateFilter }),
      Request.countDocuments({ status: "pending", ...requestDateFilter }),
    ]);

  const pendingAccounts = pendingStudents + pendingMentors;

  // top mentors aggregation (completed sessions)
  const topAgg = await safeAggregate(Request, [
    { $match: { status: "completed", ...(requestDateFilter) } },
    { $group: { _id: "$mentorId", sessions: { $sum: 1 } } },
    { $sort: { sessions: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "mentor",
      },
    },
    { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
    { $project: { mentorId: "$_id", sessions: 1, name: "$mentor.fullName" } },
  ]);

  const topMentors = (topAgg || []).map((t) => ({ name: t.name || "Unknown", sessions: t.sessions || 0 }));
  // mentor pending counts per mentor
  const pendingByMentorAgg = await safeAggregate(Request, [
    { $match: { status: "pending", ...(requestDateFilter) } },
    { $group: { _id: "$mentorId", pending: { $sum: 1 } } },
    { $sort: { pending: -1 } },
    { $limit: 50 },
    {
      $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "mentor" },
    },
    { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
    { $project: { mentorId: "$_id", pending: 1, name: "$mentor.fullName" } },
  ]);

  const mentorPendingByMentor = (pendingByMentorAgg || []).map((t) => ({ name: t.name || "Unknown", pending: t.pending || 0 }));

  // top student majors (by student profiles)
  const majorsAgg = await safeAggregate(StudentProfile, [
    { $unwind: { path: "$mentorshipAreas", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$mentorshipAreas", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
  const studentTopAreas = (majorsAgg || []).map((m) => ({ area: m._id || "Unknown", count: m.count || 0 }));

  // top universities for verified students
  const uniAgg = await safeAggregate(User, [
    { $match: { role: "student", status: "verified" } },
    { $group: { _id: "$university", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
  const studentTopUniversities = (uniAgg || []).map((u) => ({ university: u._id || "Unknown", count: u.count || 0 }));

  // area supply: count mentors by expertiseAreas
  const areaSupplyAgg = await safeAggregate(MentorProfile, [
    { $unwind: { path: "$expertiseAreas", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$expertiseAreas", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);
  const areaSupply = (areaSupplyAgg || []).reduce((acc, cur) => ({ ...acc, [cur._id || 'Unknown']: cur.count || 0 }), {});

  // area demand: from student mentorshipAreas
  const areaDemandAgg = majorsAgg; // already computed via StudentProfile mentorshipAreas
  const areaDemand = (areaDemandAgg || []).reduce((acc, cur) => ({ ...acc, [cur._id || 'Unknown']: cur.count || 0 }), {});

  return {
    totalStudents,
    totalMentors,
    pendingAccounts,
    pendingStudents,
    pendingMentors,
    completedSessions,
    pendingRequests,
    topMentors,
    mentorSessions: topMentors,
    mentorPendingByMentor,
    studentTopAreas,
    studentTopUniversities,
    areaSupply,
    areaDemand,
  };
}

// Helper to compute counts scoped to a user (mentor or student)
export async function getScopedMetricsForUser(user) {
  if (!user) return {};
  if (user.role === "mentor") {
    const [mentorCompleted, mentorPending] = await Promise.all([
      Request.countDocuments({ status: "completed", mentorId: user.id }),
      Request.countDocuments({ status: "pending", mentorId: user.id }),
    ]);
    return { completedSessions: mentorCompleted, pendingRequests: mentorPending };
  }
  if (user.role === "student") {
    const [studentCompleted, studentPending] = await Promise.all([
      Request.countDocuments({ status: "completed", studentId: user.id }),
      Request.countDocuments({ status: "pending", studentId: user.id }),
    ]);
    return { completedSessions: studentCompleted, pendingRequests: studentPending };
  }
  return {};
}
