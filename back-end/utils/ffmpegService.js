import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if we're in production (Vercel) or development
const isProduction = process.env.NODE_ENV === 'production';

// In production, we'll use the system FFmpeg or a path provided by environment variable
// In development, we'll use the installed FFmpeg from node_modules
let ffmpegPath;

if (isProduction) {
  // On Vercel, use the system FFmpeg or a path specified in environment variable
  ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  console.log(`Using FFmpeg from: ${ffmpegPath}`);
} else {
  // In development, use the installed FFmpeg from node_modules
  try {
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
    ffmpegPath = ffmpegInstaller.default.path;
    console.log(`Using FFmpeg from node_modules: ${ffmpegPath}`);
  } catch (error) {
    console.warn('Failed to load @ffmpeg-installer/ffmpeg:', error.message);
    ffmpegPath = 'ffmpeg'; // Fallback to system FFmpeg
    console.log('Falling back to system FFmpeg');
  }
}

/**
 * Process a video using FFmpeg
 * @param {Object} options - Processing options
 * @param {string} options.inputPath - Path to input video
 * @param {string} options.outputPath - Path for output video
 * @param {Array} options.args - FFmpeg arguments
 * @returns {Promise<string>} - Path to processed video
 */
export const processVideo = (options) => {
  const { inputPath, outputPath, args = [] } = options;
  
  return new Promise((resolve, reject) => {
    // Construct FFmpeg command
    const ffmpegArgs = [
      '-i', inputPath,
      ...args,
      outputPath
    ];
    
    console.log(`Running FFmpeg command: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);
    
    // Spawn FFmpeg process
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    
    let stdoutData = '';
    let stderrData = '';
    
    ffmpegProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`FFmpeg process completed successfully for ${outputPath}`);
        resolve(outputPath);
      } else {
        console.error(`FFmpeg process failed with code ${code}`);
        console.error(`FFmpeg stderr: ${stderrData}`);
        reject(new Error(`FFmpeg process failed with code ${code}: ${stderrData}`));
      }
    });
    
    ffmpegProcess.on('error', (err) => {
      console.error('Failed to start FFmpeg process:', err);
      reject(err);
    });
  });
};

/**
 * Generate a thumbnail from a video
 * @param {string} videoPath - Path to video file
 * @param {string} thumbnailPath - Path for output thumbnail
 * @param {number} timeInSeconds - Time position for thumbnail (default: 1s)
 * @returns {Promise<string>} - Path to generated thumbnail
 */
export const generateThumbnail = (videoPath, thumbnailPath, timeInSeconds = 1) => {
  return processVideo({
    inputPath: videoPath,
    outputPath: thumbnailPath,
    args: [
      '-ss', `${timeInSeconds}`,
      '-vframes', '1',
      '-q:v', '2'
    ]
  });
};

/**
 * Convert video to web-optimized format
 * @param {string} inputPath - Path to input video
 * @param {string} outputPath - Path for output video
 * @returns {Promise<string>} - Path to processed video
 */
export const convertToWebFormat = (inputPath, outputPath) => {
  return processVideo({
    inputPath,
    outputPath,
    args: [
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-vf', 'scale=-2:720'
    ]
  });
};

export default {
  processVideo,
  generateThumbnail,
  convertToWebFormat
}; 