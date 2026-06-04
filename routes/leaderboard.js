const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getLeaderboardWithDetails } = require('../transactions/recalculateLeaderboard');
const StudentProfile = require('../models/StudentProfile');

// ── IMPORTANT: specific routes MUST come before /:quizId ──
// otherwise Express matches 'global' and 'profile' as quizIds

// ── GET /api/leaderboard/profile/me ── my own stats ───────
router.get('/profile/me', protect, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      // Return empty profile instead of 404 so dashboard doesn't break
      return res.json({ success: true, profile: {
        totalPoints: 0, quizzesAttempted: 0, averageScore: 0, badges: []
      }});
    }
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/leaderboard/global/top ── top students overall
router.get('/global/top', async (req, res) => {
  try {
    const topStudents = await StudentProfile.find()
      .sort({ totalPoints: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({ success: true, count: topStudents.length, leaderboard: topStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/leaderboard/:quizId ── leaderboard for a quiz
router.get('/:quizId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const results = await getLeaderboardWithDetails(req.params.quizId, limit);
    res.json({ success: true, count: results.length, leaderboard: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
