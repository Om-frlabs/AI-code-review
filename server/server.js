import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { initDB } from './db/database.js';
import reviewRoutes from './routes/review.js';
import githubRoutes from './routes/github.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '5mb' }));

// Rate limiting on review endpoint
const reviewLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: { error: 'Too many review requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize database
initDB();

// Routes
app.use('/api/review', reviewLimiter, reviewRoutes);
app.use('/api/github', githubRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✨ Code Review API running on http://localhost:${PORT}`);
});
