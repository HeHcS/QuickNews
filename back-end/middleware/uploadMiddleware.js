import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const profileUploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, profileUploadsDir);
  },
  filename: function(req, file, cb) {
    // Use user ID + timestamp to ensure uniqueness and avoid overwriting
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${userId}-${timestamp}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instances
export const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter
}).single('profilePicture');

// Middleware to handle multer errors
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Configure multer storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/videos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and user ID if available
    const userId = req.user?._id || 'unknown';
    const timestamp = Date.now();
    const uniqueSuffix = timestamp + '-' + Math.round(Math.random() * 1E9);
    // Ensure proper extension based on mimetype
    let ext;
    switch (file.mimetype) {
      case 'video/mp4':
        ext = '.mp4';
        break;
      case 'video/webm':
        ext = '.webm';
        break;
      case 'video/quicktime':
        ext = '.mov';
        break;
      default:
        ext = '.mp4';
    }
    // Create filename without spaces
    const filename = `video-${userId}-${uniqueSuffix}${ext}`.replace(/\s+/g, '');
    cb(null, filename);
  }
});

// File filter to accept only video files
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, and QuickTime videos are allowed.'), false);
  }
};

// Configure multer upload for videos
const upload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB file size limit
  }
});

// Middleware to handle video upload errors
export const handleVideoUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        status: 'error',
        message: 'Video file size too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({ 
      status: 'error',
      message: err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      status: 'error',
      message: err.message 
    });
  }
  next();
};

export default upload; 