const mongoose = require('mongoose');

// ── Sub-schema: one answer per question ──────────────────
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    min: 0,
    max: 3,
    default: null, // null = skipped
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  marksAwarded: {
    type: Number,
    default: 0,
  },
});

// ── Main Attempt schema ───────────────────────────────────
const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [answerSchema],
    totalMarksAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarksPossible: {
      type: Number,
      required: true,
      min: 0,
    },
    percentageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      min: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'abandoned'],
      default: 'submitted',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────
attemptSchema.index({ userId: 1, quizId: 1 });     // find attempts by user + quiz
attemptSchema.index({ quizId: 1, percentageScore: -1 }); // leaderboard queries
attemptSchema.index({ userId: 1, submittedAt: -1 }); // user history

module.exports = mongoose.model('Attempt', attemptSchema);
