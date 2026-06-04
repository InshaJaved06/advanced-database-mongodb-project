const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
    },
    bestScore: {
      type: Number,       // best percentageScore across all attempts
      required: true,
      min: 0,
      max: 100,
    },
    bestMarks: {
      type: Number,
      required: true,
    },
    totalAttempts: {
      type: Number,
      default: 1,
    },
    rank: {
      type: Number,       // computed rank on this quiz
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound unique index: one leaderboard entry per user per quiz ──
leaderboardSchema.index({ quizId: 1, userId: 1 }, { unique: true });
leaderboardSchema.index({ quizId: 1, bestScore: -1 }); // rank by score
leaderboardSchema.index({ userId: 1 });                 // user's own rankings

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
