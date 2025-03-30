import express from 'express';
import { 
  streamVideoById, 
  getVideoFeed, 
  getVideoById, 
  getVideosByCategory,
  bookmarkVideo,
  removeBookmark,
  getUserBookmarks,
  getBookmarkCollections
} from '../controllers/videoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/feed', getVideoFeed);
router.get('/category/:id', getVideosByCategory);
router.get('/:id', getVideoById);
router.get('/:id/stream', streamVideoById);

// Protected routes (require authentication)
router.post('/:id/bookmark', protect, bookmarkVideo);
router.delete('/:id/bookmark', protect, removeBookmark);
router.get('/user/bookmarks', protect, getUserBookmarks);
router.get('/user/bookmark-collections', protect, getBookmarkCollections);

export default router; 