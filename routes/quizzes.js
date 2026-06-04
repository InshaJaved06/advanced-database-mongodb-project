const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { protect, adminOnly, teacherOrAdmin } = require('../middleware/auth');

// ── GET /api/quizzes ── get all published quizzes (public) ────
router.get('/', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const filter = { isPublished: true };
    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .select('-questions.correctOptionIndex -questions.explanation')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/quizzes/all ── all quizzes incl. drafts (teacher/admin) ──
router.get('/all', protect, teacherOrAdmin, async (req, res) => {
  try {
    const filter = {};
    // Teachers only see their own; admins see everything
    if (req.user.role === 'teacher') filter.createdBy = req.user._id;

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/quizzes/:id ── get single quiz ───────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctOptionIndex -questions.explanation')
      .populate('createdBy', 'name');

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Students can't see unpublished quizzes; teachers/admins can
    if (!quiz.isPublished && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Quiz not available' });
    }

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/quizzes ── create quiz (teacher or admin) ───────
router.post('/', protect, teacherOrAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Quiz created', quiz });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── PUT /api/quizzes/:id ── update quiz (teacher owns it, or admin) ──
router.put('/:id', protect, teacherOrAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Teachers can only edit their own quizzes
    if (req.user.role === 'teacher' && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own quizzes' });
    }

    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.json({ success: true, message: 'Quiz updated', quiz: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/quizzes/:id ── delete quiz (teacher owns it, or admin) ──
router.delete('/:id', protect, teacherOrAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Teachers can only delete their own quizzes
    if (req.user.role === 'teacher' && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own quizzes' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
