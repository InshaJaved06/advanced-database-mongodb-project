require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ── Connect to MongoDB ────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/quizzes',     require('./routes/quizzes'));
app.use('/api/attempts',    require('./routes/attempts'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Quiz Platform API running', status: 'ok' });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
