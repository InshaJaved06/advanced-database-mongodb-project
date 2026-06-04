const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const Leaderboard = require('../models/Leaderboard');
const StudentProfile = require('../models/StudentProfile');

/**
 * TRANSACTION 2: Quiz Submission
 *
 * Operations (all-or-nothing):
 *   1. Grade the submitted answers
 *   2. Save the Attempt document with score
 *   3. Update (or create) Leaderboard entry for this user+quiz
 *   4. Update StudentProfile: points, attempted count, averageScore
 *   5. Increment quiz's totalAttempts counter
 *
 * Why a transaction?
 *   Partial failure would cause score saved but leaderboard not updated,
 *   or profile points out of sync. All 4 writes happen atomically.
 */
const submitQuizTransaction = async ({ userId, quizId, submittedAnswers, timeTakenSeconds }) => {
  const session = await mongoose.startSession();

  try {
    let savedAttempt;

    await session.withTransaction(async () => {
      // ── Step 1: Load quiz and grade answers ───────────────
      const quiz = await Quiz.findById(quizId).session(session);
      if (!quiz) throw new Error('Quiz not found');
      if (!quiz.isPublished) throw new Error('Quiz is not available');

      let totalMarksAwarded = 0;
      const gradedAnswers = quiz.questions.map((question) => {
        const submitted = submittedAnswers.find(
          (a) => a.questionId.toString() === question._id.toString()
        );

        const selectedIndex = submitted ? submitted.selectedOptionIndex : null;
        const isCorrect = selectedIndex === question.correctOptionIndex;
        const marksAwarded = isCorrect ? question.marks : 0;

        totalMarksAwarded += marksAwarded;

        return {
          questionId: question._id,
          selectedOptionIndex: selectedIndex,
          isCorrect,
          marksAwarded,
        };
      });

      const totalMarksPossible = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
      const percentageScore = Math.round((totalMarksAwarded / totalMarksPossible) * 100);
      const passed = percentageScore >= quiz.passingScore;

      // ── Step 2: Save Attempt ──────────────────────────────
      const attemptDocs = await Attempt.create(
        [
          {
            userId,
            quizId,
            answers: gradedAnswers,
            totalMarksAwarded,
            totalMarksPossible,
            percentageScore,
            passed,
            timeTakenSeconds,
            status: 'submitted',
            submittedAt: new Date(),
          },
        ],
        { session }
      );
      savedAttempt = attemptDocs[0];

      // ── Step 3: Update Leaderboard ────────────────────────
      // upsert: create if first attempt, update if score is better
      const existingEntry = await Leaderboard.findOne({ quizId, userId }).session(session);

      if (!existingEntry) {
        // First attempt — create new leaderboard entry
        await Leaderboard.create(
          [
            {
              quizId,
              userId,
              attemptId: savedAttempt._id,
              bestScore: percentageScore,
              bestMarks: totalMarksAwarded,
              totalAttempts: 1,
              lastAttemptAt: new Date(),
            },
          ],
          { session }
        );
      } else {
        // Update only if this attempt beats their previous best
        const update = {
          $inc: { totalAttempts: 1 },
          $set: { lastAttemptAt: new Date() },
        };
        if (percentageScore > existingEntry.bestScore) {
          update.$set.bestScore = percentageScore;
          update.$set.bestMarks = totalMarksAwarded;
          update.$set.attemptId = savedAttempt._id;
        }
        await Leaderboard.findByIdAndUpdate(existingEntry._id, update, { session });
      }

      // ── Step 4: Update StudentProfile ─────────────────────
      const profile = await StudentProfile.findOne({ userId }).session(session);
      if (profile) {
        const newAttempted = profile.quizzesAttempted + 1;
        const newPassed = passed ? profile.quizzesPassed + 1 : profile.quizzesPassed;
        const newAverage = Math.round(
          ((profile.averageScore * profile.quizzesAttempted) + percentageScore) / newAttempted
        );
        const pointsEarned = totalMarksAwarded * (passed ? 2 : 1); // bonus for passing

        await StudentProfile.findByIdAndUpdate(
          profile._id,
          {
            $set: {
              quizzesAttempted: newAttempted,
              quizzesPassed: newPassed,
              averageScore: newAverage,
              lastActiveAt: new Date(),
            },
            $inc: { totalPoints: pointsEarned },
          },
          { session }
        );
      }

      // ── Step 5: Increment quiz attempt counter ────────────
      await Quiz.findByIdAndUpdate(
        quizId,
        { $inc: { totalAttempts: 1 } },
        { session }
      );
    });

    return {
      success: true,
      attempt: savedAttempt,
    };

  } catch (error) {
    throw new Error(`Quiz submission failed: ${error.message}`);
  } finally {
    session.endSession();
  }
};

module.exports = { submitQuizTransaction };
