# Vercel Deployment Guide for QuickNews Backend

## Overview

This guide explains how to deploy the QuickNews backend to Vercel, addressing the serverless function size limit issue.

## Problem

Vercel has a 300MB limit for serverless functions. Our initial deployment exceeded this limit (490.49MB) primarily due to the FFmpeg binary files included in the `@ffmpeg-installer/ffmpeg` package.

## Solution

We've implemented the following changes to reduce the deployment size:

1. Created a `.vercelignore` file to exclude unnecessary FFmpeg binaries for platforms other than the deployment target
2. Updated the FFmpeg implementation to use a more lightweight approach
3. Modified the video processing code to work with Vercel's environment

## Deployment Steps

### 1. Prepare Your Project

Ensure you have the following files in your project:
- `.vercelignore` - Excludes unnecessary files from deployment
- `vercel.json` - Configures the Vercel deployment
- `utils/ffmpegService.js` - Our custom FFmpeg service

### 2. Set Up Environment Variables

In the Vercel dashboard, add the following environment variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `NODE_ENV` - Set to "production"
- `FFMPEG_PATH` - (Optional) Path to FFmpeg binary if using a custom path

### 3. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 4. Verify Deployment

After deployment, check the function size in the Vercel dashboard. It should now be under the 300MB limit.

## Troubleshooting

If you still encounter size issues:

1. **Check the .vercelignore file**: Make sure it's properly excluding large files and directories
2. **Review dependencies**: Consider removing or replacing large dependencies
3. **Use external services**: For heavy processing like video conversion, consider using external services

## Additional Notes

- FFmpeg is now used via the system binary on Vercel or from node_modules in development
- Video processing is optimized for serverless environments
- The deployment is configured to use 1024MB of memory and a 10-second maximum duration for functions 