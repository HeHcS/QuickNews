# QuickNews Platform

A short-form video content app similar to TikTok and Instagram Reels.

## Environment Variable Configuration

### Frontend Environment Variables (.env.local in front-end directory)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000  # Backend URL for client-side code
API_BASE_URL=http://localhost:5000              # Backend URL for server-side code (NextJS)
```

### Backend Environment Variables (.env in back-end directory)

```bash
# Server Configuration
PORT=5000                        # Backend server port
NODE_ENV=development             # Environment (development, production, test)
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS
```

## Running the Application

### Development Mode

1. Install dependencies in both directories:
```bash
cd back-end && npm install
cd front-end && npm install
```

2. Start both servers:
```bash
# Terminal 1 - Backend
cd back-end && npm run dev

# Terminal 2 - Frontend
cd front-end && npm run dev
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Mode

The application is configured to run on Replit. When running in production:

1. Set appropriate environment variables for production
2. Use `npm start` at the project root to start both servers

## Important Notes

- The application is configured to run on Replit with both servers running concurrently
- URLs between frontend and backend are managed with environment variables
- Frontend makes API requests to the URL specified in `NEXT_PUBLIC_API_BASE_URL`
- Backend CORS settings are configured from the `FRONTEND_URL` environment variable 