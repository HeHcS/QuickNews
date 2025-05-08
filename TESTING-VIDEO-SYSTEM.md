# Video Streaming System Testing Guide

This document provides instructions for testing the video streaming system components.

## Prerequisites

Before testing, make sure you have:

1. MongoDB running locally or a connection to a remote MongoDB instance
2. Node.js and npm installed
3. The server dependencies installed (`npm install`)
4. A `.env` file with the required environment variables

## Test Setup

Run the following commands to set up the test environment:

```bash
# Create test files and directories
node tests/videoApiBasicTest.js

# Seed the database with test data
node tests/manualTestVideos.js
```

## Manual Testing Procedures

### 1. User Authentication

1. Start the server: `npm run dev`
2. Use one of the test accounts:
   - Admin: admin@test.com / password123
   - Creator: creator@test.com / password123
   - User: user@test.com / password123
3. Test login and retrieving the JWT token

### 2. Video Streaming

#### Basic Streaming Test

1. Start the server: `npm run dev`
2. Navigate to: `http://localhost:5000/api/videos/feed`
3. Note the ID of one of the videos
4. Test streaming by accessing: `http://localhost:5000/api/videos/{video_id}/stream`
5. Verify that video content is streamed properly

#### Range Request Testing

1. Use a tool like cURL to send range requests:
```bash
curl -i -H "Range: bytes=0-1000" http://localhost:5000/api/videos/{video_id}/stream
```
2. Verify that the server responds with status 206 and the requested range

### 3. Bookmark System

1. Login as a regular user: user@test.com / password123
2. Retrieve the JWT token
3. Use the token to access the user's bookmarks: 
```bash
curl -i -H "Authorization: Bearer {token}" http://localhost:5000/api/videos/user/bookmarks
```
4. Create a new bookmark for a video:
```bash
curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"bookmark":true,"note":"Test"}' http://localhost:5000/api/videos/{video_id}/bookmark
```
5. Verify the bookmark was created successfully

### 4. Category System

1. Access all active categories:
```bash
curl -i http://localhost:5000/api/categories
```
2. Verify that only active categories are returned
3. Test filtering videos by category:
```bash
curl -i http://localhost:5000/api/videos/category/{category_id}
```

### 5. Automated API Testing

Run the automated API test script to test all endpoints:

```bash
node tests/testVideoAPI.js
```

This script will:
1. Test authentication
2. Test video feed
3. Test categories
4. Test video streaming
5. Test bookmarks
6. Generate a test summary

## Performance Testing

For performance testing:

1. Generate a larger set of test data
2. Use tools like autocannon or JMeter to simulate multiple concurrent users
3. Monitor server resources under load
4. Test streaming performance with various video sizes

## Security Testing

Verify the security aspects:

1. Test authentication required endpoints without a token
2. Test with an expired token
3. Test cross-user authorization (attempt to access another user's bookmarks)
4. Verify role-based access control works properly (e.g., only admins can access admin endpoints)

## Cleanup

After testing, you can clean up with:

```bash
# Clear the test data from database
# Implement a cleanup script or manually remove test data
```

## Troubleshooting

If you encounter issues:

1. Check MongoDB connection
2. Verify the test files exist in the uploads directory
3. Check the server logs for errors
4. Ensure all required environment variables are set

## Testing Video Models

The models being tested in this system include:

1. `Video` - Stores video metadata and file references
2. `Category` - Manages video categories
3. `Bookmark` - Tracks user bookmarks for videos

All testing should verify the correct creation, retrieval, updating, and deletion of these models. 