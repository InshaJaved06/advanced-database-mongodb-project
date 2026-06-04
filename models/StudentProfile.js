const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizzesAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizzesPassed: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    badges: [
      {
        name: { type: String, required: true },
        description: { type: String },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    streak: {
      type: Number,
      default: 0, // consecutive days active
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────
studentProfileSchema.index({ userId: 1 }, { unique: true });
studentProfileSchema.index({ totalPoints: -1 }); // for leaderboard sorting

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
