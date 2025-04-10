import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to video storage directory (you may need to adjust this)
const VIDEOS_DIR = path.join(__dirname, '..', 'uploads', 'videos');

/**
 * Stream a video with support for range requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} filename - Name of the video file to stream
 */
export const streamVideo = async (req, res, filename) => {
  try {
    // Build the full path to the video file
    const videoPath = path.join(VIDEOS_DIR, filename);
    
    // Check if the file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Get video stats (file size, etc.)
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    
    // Get range from request headers
    const range = req.headers.range;
    
    // If range header exists, we need to send a partial response
    if (range) {
      // Parse the range header
      const parts = range.replace(/bytes=/, '').split('-');
      
      // Ensure start is a valid number
      let start = parseInt(parts[0], 10);
      if (isNaN(start)) {
        start = 0;
      }
      
      // Ensure end is a valid number and doesn't exceed file size
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (isNaN(end) || end >= fileSize) {
        end = fileSize - 1;
      }
      
      // Ensure start doesn't exceed file size or end position
      if (start >= fileSize || start > end) {
        // Return 416 Range Not Satisfiable
        return res.status(416).send({
          message: 'Requested range not satisfiable',
          range,
          fileSize
        });
      }
      
      // Calculate the chunk size
      const chunkSize = (end - start) + 1;
      
      // Set maximum chunk size to prevent excessive memory usage
      const MAX_CHUNK_SIZE = 1024 * 1024 * 10; // 10MB
      if (chunkSize > MAX_CHUNK_SIZE) {
        end = start + MAX_CHUNK_SIZE - 1;
      }
      
      // Create read stream for this chunk
      const file = fs.createReadStream(videoPath, { start, end });
      
      // Add error handler to the stream
      file.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming video', error: err.message });
        }
      });
      
      // Set appropriate headers for partial content
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': getContentType(filename)
      };
      
      // Send partial content response (HTTP 206)
      res.writeHead(206, headers);
      
      // Pipe the file stream to the response
      file.pipe(res);
    } else {
      // No range header, send the entire file
      // For large files, it's better to use a default range instead of sending the whole file
      if (fileSize > 1024 * 1024 * 50) { // If file is larger than 50MB
        const start = 0;
        const end = 1024 * 1024 * 2 - 1; // Send first 2MB
        
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end + 1,
          'Content-Type': getContentType(filename)
        };
        
        res.writeHead(206, headers);
        const file = fs.createReadStream(videoPath, { start, end });
        file.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming video', error: err.message });
          }
        });
        file.pipe(res);
      } else {
        const headers = {
          'Content-Length': fileSize,
          'Content-Type': getContentType(filename),
          'Accept-Ranges': 'bytes'
        };
        
        res.writeHead(200, headers);
        const file = fs.createReadStream(videoPath);
        file.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming video', error: err.message });
          }
        });
        file.pipe(res);
      }
    }
  } catch (error) {
    console.error('Video streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming video', error: error.message });
    }
  }
};

/**
 * Get content type based on file extension
 * @param {string} filename - Video filename
 * @returns {string} - Content type
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.ogg':
      return 'video/ogg';
    case '.mov':
      return 'video/quicktime';
    default:
      return 'video/mp4'; // Default fallback
  }
}

/**
 * Ensure the videos directory exists
 */
export const ensureVideosDirExists = () => {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log(`Created videos directory at ${VIDEOS_DIR}`);
  }
};

// Export the videos directory path
export const getVideosDir = () => VIDEOS_DIR; 