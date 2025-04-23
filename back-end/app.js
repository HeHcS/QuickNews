import express from 'express';
import cors from 'cors';
import videoRoutes from './routes/videoRoutes.js';

const app = express();

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:3000'], // Allow frontend ports
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    credentials: true, // Enable credentials (cookies, authorization headers)
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'] // Expose headers needed for video streaming
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/videos', videoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error('Error:', {
        status: statusCode,
        message: err.message,
        stack: err.stack
    });
    res.status(statusCode).json({ 
        message: err.message || 'Something went wrong!',
        status: statusCode
    });
});

export default app; 