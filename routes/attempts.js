const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const { protect } = require('../middleware/auth');
const { submitQuizTransaction } = require('../transactions/submitQuiz');
const { recalculateLeaderboardTransaction } = require('../transactions/recalculateLeaderboard');

// ── POST /api/attempts/submit ── submit a quiz ────────────
// This triggers Transaction 2 (the big one)
router.post('/submit', protect, async (req, res) => {
  try {
    const { quizId, answers, timeTakenSeconds } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ success: false, message: 'quizId and answers are required' });
    }

    // Transaction 2: save attempt + update leaderboard + update profile atomically
    const { attempt } = await submitQuizTransaction({
      userId: req.user._id,
      quizId,
      submittedAnswers: answers,
      timeTakenSeconds: timeTakenSeconds || 0,
    });

    // Transaction 3: recalculate ranks for this quiz
    await recalculateLeaderboardTransaction(quizId);

    res.status(201).json({
      success: true,
      message: attempt.passed ? 'Quiz passed! Well done!' : 'Quiz submitted. Better luck next time!',
      result: {
        score: attempt.percentageScore,
        passed: attempt.passed,
        marksAwarded: attempt.totalMarksAwarded,
        totalMarks: attempt.totalMarksPossible,
        timeTaken: attempt.timeTakenSeconds,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/attempts/my ── get current user's attempts ───
router.get('/my', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user._id })
      .populate('quizId', 'title category difficulty')
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/attempts/:id ── get single attempt result ────
router.get('/:id', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quizId', 'title questions category')
      .populate('userId', 'name email');

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    // only the owner or admin can see attempt details
    if (attempt.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
