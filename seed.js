require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const Quiz = require('./models/Quiz');
const Attempt = require('./models/Attempt');
const Leaderboard = require('./models/Leaderboard');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected for seeding...');
};

const seedData = async () => {
  await connectDB();

  // ── Clean existing data ───────────────────────────────
  console.log('Clearing old data...');
  await User.deleteMany({});
  await StudentProfile.deleteMany({});
  await Quiz.deleteMany({});
  await Attempt.deleteMany({});
  await Leaderboard.deleteMany({});

  // ── Create Users ──────────────────────────────────────
  console.log('Creating users...');
  const hashedPass = await bcrypt.hash('password123', 10);

  const users = await User.insertMany([
    { name: 'Admin User',   email: 'admin@quiz.com',  password: hashedPass, role: 'admin' },
    { name: 'Ali Hassan',   email: 'ali@quiz.com',    password: hashedPass, role: 'student' },
    { name: 'Sara Khan',    email: 'sara@quiz.com',   password: hashedPass, role: 'student' },
    { name: 'Usman Ahmed',  email: 'usman@quiz.com',  password: hashedPass, role: 'student' },
    { name: 'Fatima Malik', email: 'fatima@quiz.com', password: hashedPass, role: 'student' },
  ]);

  const [admin, ali, sara, usman, fatima] = users;
  console.log(`Created ${users.length} users`);

  // ── Create Student Profiles ───────────────────────────
  console.log('Creating student profiles...');
  await StudentProfile.insertMany([
    { userId: ali._id,    totalPoints: 340, quizzesAttempted: 5, quizzesPassed: 4, averageScore: 78, badges: [{ name: 'First Quiz', description: 'Completed first quiz' }] },
    { userId: sara._id,   totalPoints: 520, quizzesAttempted: 7, quizzesPassed: 7, averageScore: 91, badges: [{ name: 'Perfect Score', description: 'Got 100% on a quiz' }, { name: 'Streaker', description: '5 day streak' }] },
    { userId: usman._id,  totalPoints: 180, quizzesAttempted: 3, quizzesPassed: 2, averageScore: 65, badges: [{ name: 'First Quiz', description: 'Completed first quiz' }] },
    { userId: fatima._id, totalPoints: 410, quizzesAttempted: 6, quizzesPassed: 5, averageScore: 83, badges: [{ name: 'First Quiz', description: 'Completed first quiz' }] },
  ]);
  console.log('Created 4 student profiles');

  // ── Create Quizzes ────────────────────────────────────
  console.log('Creating quizzes...');
  const quizzes = await Quiz.insertMany([
    {
      title: 'JavaScript Basics',
      description: 'Test your knowledge of JavaScript fundamentals',
      category: 'Technology',
      difficulty: 'Easy',
      timeLimitMinutes: 10,
      passingScore: 60,
      createdBy: admin._id,
      isPublished: true,
      totalAttempts: 4,
      questions: [
        {
          questionText: 'Which keyword is used to declare a variable in JavaScript?',
          options: ['var', 'int', 'string', 'define'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'var, let, and const are used in JavaScript. int is from C/Java.'
        },
        {
          questionText: 'What does DOM stand for?',
          options: ['Document Object Model', 'Data Object Model', 'Document Oriented Model', 'Data Oriented Module'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'DOM stands for Document Object Model.'
        },
        {
          questionText: 'Which method adds an element to the end of an array?',
          options: ['push()', 'pop()', 'shift()', 'unshift()'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'push() adds to end, pop() removes from end.'
        },
        {
          questionText: 'What is the output of typeof null?',
          options: ['object', 'null', 'undefined', 'string'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: 'typeof null returns "object" — a known JS quirk.'
        },
        {
          questionText: 'Which symbol is used for single line comments in JavaScript?',
          options: ['//', '/* */', '#', '--'],
          correctOptionIndex: 0,
          marks: 2,
          explanation: '// is for single line, /* */ for multi-line comments.'
        },
      ],
    },
    {
      title: 'World Geography Quiz',
      description: 'How well do you know the world?',
      category: 'Geography',
      difficulty: 'Medium',
      timeLimitMinutes: 15,
      passingScore: 50,
      createdBy: admin._id,
      isPublished: true,
      totalAttempts: 4,
      questions: [
        {
          questionText: 'What is the capital of Australia?',
          options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: 'Canberra is the capital, not Sydney.'
        },
        {
          questionText: 'Which is the longest river in the world?',
          options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'The Nile is the longest river at about 6,650 km.'
        },
        {
          questionText: 'Which country has the largest population?',
          options: ['USA', 'India', 'China', 'Russia'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: 'India surpassed China as the most populous country in 2023.'
        },
        {
          questionText: 'Mount Everest is located in which mountain range?',
          options: ['Andes', 'Alps', 'Rockies', 'Himalayas'],
          correctOptionIndex: 3,
          marks: 2,
          explanation: 'Mount Everest is in the Himalayas between Nepal and Tibet.'
        },
        {
          questionText: 'Which ocean is the largest?',
          options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
          correctOptionIndex: 3,
          marks: 2,
          explanation: 'The Pacific Ocean is the largest, covering about 165 million km².'
        },
      ],
    },
    {
      title: 'Basic Mathematics',
      description: 'Arithmetic and number theory fundamentals',
      category: 'Math',
      difficulty: 'Easy',
      timeLimitMinutes: 10,
      passingScore: 70,
      createdBy: admin._id,
      isPublished: true,
      totalAttempts: 3,
      questions: [
        {
          questionText: 'What is 15 × 8?',
          options: ['100', '110', '120', '130'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: '15 × 8 = 120'
        },
        {
          questionText: 'What is the square root of 144?',
          options: ['10', '11', '12', '13'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: '12 × 12 = 144'
        },
        {
          questionText: 'What is 25% of 200?',
          options: ['25', '40', '50', '75'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: '25% of 200 = 0.25 × 200 = 50'
        },
        {
          questionText: 'Which of these is a prime number?',
          options: ['9', '15', '17', '21'],
          correctOptionIndex: 2,
          marks: 2,
          explanation: '17 is prime. 9=3×3, 15=3×5, 21=3×7.'
        },
        {
          questionText: 'What is 2 to the power of 8?',
          options: ['128', '256', '512', '64'],
          correctOptionIndex: 1,
          marks: 2,
          explanation: '2^8 = 256'
        },
      ],
    },
  ]);

  const [jsQuiz, geoQuiz, mathQuiz] = quizzes;
  console.log(`Created ${quizzes.length} quizzes`);

  // ── Create Attempts ───────────────────────────────────
  console.log('Creating attempts...');

  const makeAnswers = (quiz, userAnswers) =>
    quiz.questions.map((q, i) => {
      const selected = userAnswers[i];
      const isCorrect = selected === q.correctOptionIndex;
      return {
        questionId: q._id,
        selectedOptionIndex: selected,
        isCorrect,
        marksAwarded: isCorrect ? q.marks : 0,
      };
    });

  // Ali: JS Quiz — 8/10 = 80%
  const aliJsAnswers = makeAnswers(jsQuiz, [0, 0, 0, 0, 1]);
  const aliJsMarks = aliJsAnswers.reduce((s, a) => s + a.marksAwarded, 0);
  const aliJsAttempt = await Attempt.create({
    userId: ali._id, quizId: jsQuiz._id,
    answers: aliJsAnswers, totalMarksAwarded: aliJsMarks,
    totalMarksPossible: 10, percentageScore: aliJsMarks * 10,
    passed: aliJsMarks * 10 >= 60, timeTakenSeconds: 320, status: 'submitted',
  });

  // Sara: JS Quiz — 10/10 = 100%
  const saraJsAnswers = makeAnswers(jsQuiz, [0, 0, 0, 0, 0]);
  const saraJsAttempt = await Attempt.create({
    userId: sara._id, quizId: jsQuiz._id,
    answers: saraJsAnswers, totalMarksAwarded: 10,
    totalMarksPossible: 10, percentageScore: 100,
    passed: true, timeTakenSeconds: 210, status: 'submitted',
  });

  // Usman: JS Quiz — 6/10 = 60%
  const usmanJsAnswers = makeAnswers(jsQuiz, [0, 0, 1, 1, 0]);
  const usmanJsAttempt = await Attempt.create({
    userId: usman._id, quizId: jsQuiz._id,
    answers: usmanJsAnswers, totalMarksAwarded: 6,
    totalMarksPossible: 10, percentageScore: 60,
    passed: true, timeTakenSeconds: 480, status: 'submitted',
  });

  // Fatima: Geography Quiz — 8/10 = 80%
  const fatimaGeoAnswers = makeAnswers(geoQuiz, [2, 1, 1, 3, 3]);
  const fatimaGeoAttempt = await Attempt.create({
    userId: fatima._id, quizId: geoQuiz._id,
    answers: fatimaGeoAnswers, totalMarksAwarded: 8,
    totalMarksPossible: 10, percentageScore: 80,
    passed: true, timeTakenSeconds: 390, status: 'submitted',
  });

  // Sara: Math Quiz — 10/10 = 100%
  const saraMathAnswers = makeAnswers(mathQuiz, [2, 2, 2, 2, 1]);
  const saraMathAttempt = await Attempt.create({
    userId: sara._id, quizId: mathQuiz._id,
    answers: saraMathAnswers, totalMarksAwarded: 10,
    totalMarksPossible: 10, percentageScore: 100,
    passed: true, timeTakenSeconds: 190, status: 'submitted',
  });

  console.log('Created 5 attempts');

  // ── Create Leaderboard entries ────────────────────────
  console.log('Creating leaderboard...');
  await Leaderboard.insertMany([
    { quizId: jsQuiz._id,   userId: sara._id,   attemptId: saraJsAttempt._id,   bestScore: 100, bestMarks: 10, totalAttempts: 1, rank: 1 },
    { quizId: jsQuiz._id,   userId: ali._id,    attemptId: aliJsAttempt._id,    bestScore: 80,  bestMarks: 8,  totalAttempts: 1, rank: 2 },
    { quizId: jsQuiz._id,   userId: usman._id,  attemptId: usmanJsAttempt._id,  bestScore: 60,  bestMarks: 6,  totalAttempts: 1, rank: 3 },
    { quizId: geoQuiz._id,  userId: fatima._id, attemptId: fatimaGeoAttempt._id, bestScore: 80, bestMarks: 8,  totalAttempts: 1, rank: 1 },
    { quizId: mathQuiz._id, userId: sara._id,   attemptId: saraMathAttempt._id,  bestScore: 100, bestMarks: 10, totalAttempts: 1, rank: 1 },
  ]);
  console.log('Created leaderboard entries');

  console.log('\n✅ DATABASE SEEDED SUCCESSFULLY!');
  console.log('================================');
  console.log('Users:            5 (1 admin, 4 students)');
  console.log('Student Profiles: 4');
  console.log('Quizzes:          3 (JS, Geography, Math)');
  console.log('Attempts:         5');
  console.log('Leaderboard:      5 entries');
  console.log('\nLogin with any student email + password: password123');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
