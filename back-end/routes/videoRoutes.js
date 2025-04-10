import express from 'express';
import { 
  streamVideoById, 
  getVideoFeed, 
  getVideoById, 
  getVideosByCategory,
  bookmarkVideo,
  removeBookmark,
  getUserBookmarks,
  getBookmarkCollections,
  uploadVideo,
  getAllVideos,
  getVideo
} from '../controllers/videoController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { handleVideoUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/feed', getVideoFeed);
router.get('/category/:id', getVideosByCategory);
router.get('/:id', getVideo);
router.get('/:id/stream', streamVideoById);
router.get('/', getAllVideos);

// Protected routes (require authentication)
router.post('/:id/bookmark', protect, bookmarkVideo);
router.delete('/:id/bookmark', protect, removeBookmark);
router.get('/user/bookmarks', protect, getUserBookmarks);
router.get('/user/bookmark-collections', protect, getBookmarkCollections);
router.post('/upload', protect, upload.single('video'), handleVideoUploadErrors, uploadVideo);

export default router; 