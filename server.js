import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorMiddleware.js';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { initRedis, closeRedis } from './utils/redisCache.js';
import { ensureVideosDirExists } from './utils/videoStream.js';
import { ensureProfilesDirExists } from './utils/fileSystem.js';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Passport
app.use(passport.initialize());

// Environment variables
const PORT = process.env.PORT || 9000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI;
const TEST_MODE = process.env.TEST_MODE === 'true';

// Validate environment variables
if (!MONGODB_URI && !TEST_MODE) {
  console.error('MONGODB_URI environment variable is required unless TEST_MODE is enabled');
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  if (TEST_MODE && !MONGODB_URI) {
    console.log('TEST_MODE enabled - skipping MongoDB connection');
    return false;
  }
  
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (TEST_MODE) {
      console.warn('Continuing in TEST_MODE despite MongoDB connection failure');
      return false;
    } else {
      throw error; // Re-throw in non-TEST_MODE
    }
  }
};

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Video Platform API is running',
    status: 'ok',
    environment: NODE_ENV,
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    testMode: TEST_MODE
  });
});

// Simple route to test error handler
app.get('/api/error-test', (req, res, next) => {
  try {
    // Force an error
    throw new Error('Test error - this is expected!');
  } catch (error) {
    next(error);
  }
});

// 404 route - must be after all valid routes
app.use('*', (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// Export app for testing
export default app;

// Start server function
const startServer = async () => {
  // Ensure required directories exist
  ensureVideosDirExists();
  ensureProfilesDirExists();
  
  // Initialize Redis
  await initRedis();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    console.log(`MongoDB status: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
    console.log(`Test mode: ${TEST_MODE ? 'enabled' : 'disabled'}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      
      // Close Redis connection
      closeRedis().catch(err => console.error('Error closing Redis:', err));
      
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  });

  return server;
};

// Connect to database then start server
connectDB()
  .then(async connected => {
    if (!connected && !TEST_MODE) {
      console.warn('Warning: Server starting without MongoDB connection. Some features may be unavailable.');
    }
    await startServer();
  })
  .catch(err => {
    console.error('Server initialization failed:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
}); 