const mongoose = require('mongoose');
const Leaderboard = require('../models/Leaderboard');

/**
 * TRANSACTION 3: Leaderboard Rank Recalculation
 *
 * Operations (all-or-nothing):
 *   1. Fetch all leaderboard entries for a quiz, sorted by bestScore DESC
 *   2. Assign rank numbers (1, 2, 3...) to each entry
 *   3. Bulk-write all rank updates together
 *
 * Why a transaction?
 *   If rank updates are partial (some succeed, some fail), the
 *   leaderboard shows inconsistent ranks. All updates commit together
 *   or none do.
 *
 * When to call this:
 *   - After every quiz submission (called internally from submitQuiz)
 *   - On-demand by admin to refresh ranks
 */
const recalculateLeaderboardTransaction = async (quizId) => {
  const session = await mongoose.startSession();

  try {
    let rankedEntries;

    await session.withTransaction(async () => {
      // ── Step 1: Fetch all entries sorted by best score ────
      const entries = await Leaderboard.find({ quizId })
        .sort({ bestScore: -1, lastAttemptAt: 1 }) // desc score, then earliest attempt wins tie
        .session(session);

      if (entries.length === 0) return;

      // ── Step 2: Assign rank numbers ───────────────────────
      // Handle ties: same score = same rank, next rank skips (1,1,3...)
      let currentRank = 1;
      for (let i = 0; i < entries.length; i++) {
        if (i > 0 && entries[i].bestScore < entries[i - 1].bestScore) {
          currentRank = i + 1; // only increment rank when score actually drops
        }
        entries[i].rank = currentRank;
      }

      // ── Step 3: Bulk write all rank updates ───────────────
      const bulkOps = entries.map((entry) => ({
        updateOne: {
          filter: { _id: entry._id },
          update: { $set: { rank: entry.rank } },
        },
      }));

      await Leaderboard.bulkWrite(bulkOps, { session });
      rankedEntries = entries;
    });

    return {
      success: true,
      totalRanked: rankedEntries ? rankedEntries.length : 0,
    };

  } catch (error) {
    throw new Error(`Leaderboard recalculation failed: ${error.message}`);
  } finally {
    session.endSession();
  }
};

/**
 * Helper: Get leaderboard for a quiz (with user details)
 * Uses aggregation pipeline — no transaction needed (read-only)
 */
const getLeaderboardWithDetails = async (quizId, limit = 10) => {
  const results = await Leaderboard.aggregate([
    { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
    { $sort: { rank: 1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { name: 1, email: 1 } }],
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        rank: 1,
        bestScore: 1,
        bestMarks: 1,
        totalAttempts: 1,
        lastAttemptAt: 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
  ]);

  return results;
};

module.exports = { recalculateLeaderboardTransaction, getLeaderboardWithDetails };
