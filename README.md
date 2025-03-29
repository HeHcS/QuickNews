# Video Platform Backend

This project is a backend API for a video platform with features like authentication, video management, and more.

## Project Structure

```
project/
├── config/        # Configuration files
├── controllers/   # Route controllers
├── middleware/    # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── utils/         # Utility functions
├── .env           # Environment variables (not tracked by git)
├── .env.example   # Example environment variables
├── .gitignore     # Git ignore file
├── package.json   # Project dependencies
└── server.js      # Entry point
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests

## API Endpoints

The API will be documented here as it is developed.

## Technologies

- Node.js
- Express.js
- MongoDB
- Passport.js for authentication
- JWT for authorization
