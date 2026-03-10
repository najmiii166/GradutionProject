import Feedback from "../models/Feedback.js";
import mongoose from "mongoose";

export const getMentorBadge = (averageRating, totalRatings) => {
  const avg = Number(averageRating || 0);
  const total = Number(totalRatings || 0);
  if (avg >= 4.7 && total >= 10) return "Top Mentor";
  if (avg >= 4.5 && total >= 5) return "Highly Rated";
  if (avg >= 4 && total >= 3) return "Recommended";
  return "—";
};

export const getPositiveRatingPercent = (ratings = []) => {
  try {
    if (!ratings.length) return 0;
    const positive = ratings.filter((item) => Number(item?.score || 0) >= 4).length;
    return Math.round((positive / ratings.length) * 100);
  } catch {
    return 0;
  }
};

export async function getMentorRatingSummary(mentorProfileId, { includeRecent = false, recentLimit = 5 } = {}) {
  if (!mentorProfileId) {
    return {
      averageRating: 0,
      totalRatings: 0,
      badge: "—",
      percentPositive: 0,
      ratings: [],
      recentRatings: [],
    };
  }

  const feedbackItems = await Feedback.find({
    mentorId: mentorProfileId,
    raterRole: "student",
    rating: { $exists: true, $gt: 0 },
  })
    .populate("studentId", "fullName role")
    .sort({ createdAt: -1 })
    .lean();

  const ratings = feedbackItems.map((item) => ({
    user: item.studentId?._id || item.studentId || null,
    userName: item.studentId?.fullName || "Anonymous",
    userRole: item.studentId?.role || "student",
    score: Number(item.rating || 0),
    comment: item.comment || "",
    createdAt: item.createdAt || null,
  }));

  const totalRatings = ratings.length;
  const averageRating = totalRatings
    ? Number((ratings.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalRatings).toFixed(1))
    : 0;

  return {
    averageRating,
    totalRatings,
    badge: getMentorBadge(averageRating, totalRatings),
    percentPositive: getPositiveRatingPercent(ratings),
    ratings,
    recentRatings: includeRecent ? ratings.slice(0, recentLimit) : [],
  };
}

export async function getMentorRatingSummaryMap(mentorProfileIds = []) {
  const uniqueIds = [...new Set((mentorProfileIds || []).filter(Boolean).map((id) => String(id)))];
  if (!uniqueIds.length) return new Map();

  const rows = await Feedback.aggregate([
    {
      $match: {
        mentorId: {
          $in: uniqueIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        raterRole: "student",
        rating: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: "$mentorId",
        totalRatings: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        positiveCount: {
          $sum: {
            $cond: [{ $gte: ["$rating", 4] }, 1, 0],
          },
        },
      },
    },
  ]);

  return new Map(
    rows.map((row) => {
      const totalRatings = Number(row.totalRatings || 0);
      const averageRating = totalRatings ? Number(Number(row.averageRating || 0).toFixed(1)) : 0;
      const percentPositive = totalRatings
        ? Math.round((Number(row.positiveCount || 0) / totalRatings) * 100)
        : 0;

      return [
        String(row._id),
        {
          averageRating,
          totalRatings,
          percentPositive,
          badge: getMentorBadge(averageRating, totalRatings),
        },
      ];
    })
  );
}
