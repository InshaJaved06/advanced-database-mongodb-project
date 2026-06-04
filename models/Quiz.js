const mongoose = require('mongoose');

// ── Sub-schema: individual question ──────────────────────
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'Each question must have exactly 4 options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3, // index 0-3 matching options array
  },
  marks: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  explanation: {
    type: String, // shown after submission
    trim: true,
  },
});

// ── Main Quiz schema ──────────────────────────────────────
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: ['Math', 'Science', 'History', 'Geography', 'Technology', 'General Knowledge', 'Other'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'Quiz must have at least 1 question',
      },
    },
    timeLimitMinutes: {
      type: Number,
      required: true,
      min: [1, 'Time limit must be at least 1 minute'],
      max: [180, 'Time limit cannot exceed 3 hours'],
    },
    passingScore: {
      type: Number,
      default: 50, // percentage
      min: 0,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Virtual: total marks for this quiz ───────────────────
quizSchema.virtual('totalMarks').get(function () {
  return this.questions.reduce((sum, q) => sum + q.marks, 0);
});

// ── Indexes ───────────────────────────────────────────────
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
