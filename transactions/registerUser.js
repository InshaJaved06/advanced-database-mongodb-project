const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

/**
 * TRANSACTION 1: User Registration
 *
 * Operations (all-or-nothing):
 *   1. Create user document in `users` collection
 *   2. Create student_profile document in `student_profiles` collection
 *
 * Why a transaction?
 *   If user is created but profile creation fails, we'd have a user
 *   with no profile — broken state. The transaction rolls both back.
 */
const registerUserTransaction = async ({ name, email, password, role = 'student' }) => {
  const session = await mongoose.startSession();

  try {
    let newUser;
    let newProfile;

    await session.withTransaction(async () => {
      // ── Step 1: Create the User ──────────────────────────
      const userDocs = await User.create(
        [{ name, email, password, role }],
        { session }
      );
      newUser = userDocs[0];

      // ── Step 2: Initialize StudentProfile ────────────────
      // (only for students — admins don't need a quiz profile)
      if (role === 'student') {
        const profileDocs = await StudentProfile.create(
          [
            {
              userId: newUser._id,
              totalPoints: 0,
              quizzesAttempted: 0,
              quizzesPassed: 0,
              averageScore: 0,
              badges: [],
              streak: 0,
              lastActiveAt: new Date(),
            },
          ],
          { session }
        );
        newProfile = profileDocs[0];
      }
    });

    return {
      success: true,
      user: newUser,
      profile: newProfile || null,
    };

  } catch (error) {
    // Transaction auto-rolled back by withTransaction()
    throw new Error(`Registration failed: ${error.message}`);
  } finally {
    session.endSession();
  }
};

module.exports = { registerUserTransaction };
