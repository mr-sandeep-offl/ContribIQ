const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.warn(`[WARNING] Missing environment variables in this environment: ${missingEnv.join(', ')}`);
  console.warn('Please configure these in your Vercel project environment variables settings.');
}

// Start initial connection (non-blocking for module load)
let dbConnectionPromise = connectDB().catch((err) => {
  console.error('CRITICAL ERROR: Failed to connect to database on startup:', err.message);
});

const app = express();


// Middleware: ensure DB is connected before handling any request (critical for serverless)
app.use(async (req, res, next) => {
  try {
    await dbConnectionPromise;
    // If connection was lost, reconnect
    if (require('mongoose').connection.readyState !== 1) {
      dbConnectionPromise = connectDB();
      await dbConnectionPromise;
    }
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database connection unavailable. Please try again shortly.' });
  }
});

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Security and standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Listen only if not in serverless/production environment or run directly
if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
