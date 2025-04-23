import Video from '../models/videoModel.js';
import Bookmark from '../models/bookmarkModel.js';
import mongoose from 'mongoose';
import { streamVideo, getVideosDir } from '../utils/videoStream.js';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/redisCache.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import path from 'path';
import fs from 'fs';

// Get videos directory
const VIDEOS_DIR = getVideosDir();

// Cache keys
const CACHE_KEYS = {
  FEED: 'feed:',
  CATEGORIES: 'categories:',
  VIDEO: 'video:'
};

/**
 * Stream a specific video
 * @route GET /api/videos/:id/stream
 * @access Public
 */
export const streamVideoById = async (req, res) => {
  try {
    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    if (!video.isPublished) {
      return res.status(403).json({ message: 'This video is not available' });
    }
    
    // Check if the video file exists
    const fullPath = path.join(VIDEOS_DIR, video.videoFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }
    
    // Increment view count (don't await to not delay the streaming)
    Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();
    
    // Stream the video
    streamVideo(req, res, video.videoFile);
  } catch (error) {
    console.error('Error streaming video:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming video', error: error.message });
    }
  }
};

/**
 * Get video feed with pagination
 * @route GET /api/videos/feed
 * @access Public
 */
export const getVideoFeed = async (req, res) => {
  try {
    // Parse and validate pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1); // Ensure page is at least 1
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); // Between 1 and 50
    const skip = (page - 1) * limit;
    
    // Get category from query params
    const category = req.query.category;
    
    const userId = req.user ? req.user._id : null;
    
    // Create a cache key based on the request parameters
    const cacheKey = `${CACHE_KEYS.FEED}${page}:${limit}:${category || 'all'}:${userId || 'anon'}`;
    
    // Try to get cached feed data
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Build query
    const query = { isPublished: true };
    
    // Filter by category if specified
    if (category && category !== 'For You') {
      query.categories = category;
    }
    
    // Find videos with populated creator
    let feedQuery = Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name profilePicture');
    
    // If user is authenticated, include information about likes and bookmarks
    if (userId) {
      try {
        // Use aggregation to include user-specific data
        const videos = await Video.aggregate([
          { $match: query },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          // Lookup likes count
          {
            $lookup: {
              from: 'likes',
              let: { videoId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$content', '$$videoId'] },
                        { $eq: ['$contentType', 'Video'] }
                      ]
                    }
                  }
                }
              ],
              as: 'likesInfo'
            }
          },
          // Add likes count field
          {
            $addFields: {
              likes: { $size: '$likesInfo' }
            }
          },
          // Lookup comments count
          {
            $lookup: {
              from: 'comments',
              let: { videoId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$content', '$$videoId'] },
                        { $eq: ['$contentType', 'Video'] },
                        { $eq: ['$parentComment', null] }  // Only count top-level comments
                      ]
                    }
                  }
                }
              ],
              as: 'commentsInfo'
            }
          },
          // Add comments count field
          {
            $addFields: {
              comments: { $size: '$commentsInfo' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'creator',
              foreignField: '_id',
              as: 'creator'
            }
          },
          { 
            $unwind: {
              path: '$creator',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'categories',
              foreignField: '_id',
              as: 'categories'
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              let: { videoId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$video', '$$videoId'] },
                        { $eq: ['$user', mongoose.Types.ObjectId(userId)] }
                      ]
                    }
                  }
                }
              ],
              as: 'bookmarkInfo'
            }
          },
          // Check if current user has liked the video
          {
            $lookup: {
              from: 'likes',
              let: { videoId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$content', '$$videoId'] },
                        { $eq: ['$contentType', 'Video'] },
                        { $eq: ['$user', mongoose.Types.ObjectId(userId)] }
                      ]
                    }
                  }
                }
              ],
              as: 'userLikeInfo'
            }
          },
          {
            $addFields: {
              userBookmarked: { $gt: [{ $size: '$bookmarkInfo' }, 0] },
              userLiked: { $gt: [{ $size: '$userLikeInfo' }, 0] }
            }
          },
          { 
            $project: { 
              bookmarkInfo: 0,
              likesInfo: 0,
              userLikeInfo: 0,
              commentsInfo: 0
            } 
          }
        ]);
        
        // Get total count for pagination
        const total = await Video.countDocuments(query);
        
        const responseData = {
          videos,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
        
        // Cache the results
        await setCache(cacheKey, responseData);
        
        return res.json(responseData);
      } catch (aggregateError) {
        // If aggregation fails, fall back to simple query
        console.error('Aggregation error, falling back to simple query:', aggregateError);
      }
    }
    
    // For anonymous users or if aggregation failed, use the simpler query with likes count
    const videos = await Video.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Lookup likes count
      {
        $lookup: {
          from: 'likes',
          let: { videoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$content', '$$videoId'] },
                    { $eq: ['$contentType', 'Video'] }
                  ]
                }
              }
            }
          ],
          as: 'likesInfo'
        }
      },
      // Add likes count field
      {
        $addFields: {
          likes: { $size: '$likesInfo' }
        }
      },
      // Lookup comments count
      {
        $lookup: {
          from: 'comments',
          let: { videoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$content', '$$videoId'] },
                    { $eq: ['$contentType', 'Video'] },
                    { $eq: ['$parentComment', null] }  // Only count top-level comments
                  ]
                }
              }
            }
          ],
          as: 'commentsInfo'
        }
      },
      // Add comments count field
      {
        $addFields: {
          comments: { $size: '$commentsInfo' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { 
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories'
        }
      },
      { 
        $project: { 
          likesInfo: 0,
          commentsInfo: 0
        } 
      }
    ]);

    const total = await Video.countDocuments(query);
    
    const responseData = {
      videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Cache the results
    await setCache(cacheKey, responseData);
    
    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching video feed:', error);
    res.status(500).json({ message: 'Error fetching video feed', error: error.message });
  }
};

/**
 * Get a specific video by ID
 * @route GET /api/videos/:id
 * @access Public
 */
export const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const userId = req.user ? req.user._id : null;
    
    // Create cache key
    const cacheKey = `${CACHE_KEYS.VIDEO}${videoId}:${userId || 'anon'}`;
    
    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Find the video with populated fields
    const video = await Video.findById(videoId)
      .populate('creator', 'name profilePicture')
      .populate('categories', 'name icon color')
      .populate('linkedArticle');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    if (!video.isPublished) {
      // Only creators and admins can see unpublished videos
      if (!req.user || (req.user._id.toString() !== video.creator._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'This video is not available' });
      }
    }
    
    // Check if the user has bookmarked this video
    if (userId) {
      const bookmarkExists = await Bookmark.exists({ 
        user: userId, 
        video: videoId 
      });
      
      // Add user-specific data
      video._userBookmarked = !!bookmarkExists;
      // Add more user-specific data as needed
    }
    
    // Cache the result
    await setCache(cacheKey, video);
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Error fetching video', error: error.message });
  }
};

/**
 * Get all categories
 * @route GET /api/videos/categories
 * @access Public
 */
export const getCategories = async (req, res) => {
  try {
    // Import categories from frontend config to ensure consistency
    const { APP_CATEGORIES } = await import('../../front-end/src/config/categories.js');
    res.json(APP_CATEGORIES);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

/**
 * Bookmark a video
 * @route POST /api/videos/:id/bookmark
 * @access Private
 */
export const bookmarkVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const userId = req.user._id;
    const { notes, collectionName } = req.body;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    if (!video.isPublished) {
      return res.status(403).json({ message: 'Cannot bookmark unavailable videos' });
    }
    
    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({ user: userId, video: videoId });
    
    if (existingBookmark) {
      // Update existing bookmark
      existingBookmark.notes = notes || existingBookmark.notes;
      existingBookmark.collectionName = collectionName || existingBookmark.collectionName;
      await existingBookmark.save();
      
      // Clear related cache
      await clearCacheByPattern(`${CACHE_KEYS.VIDEO}${videoId}:${userId}`);
      await clearCacheByPattern(`${CACHE_KEYS.FEED}*:${userId}`);
      
      return res.json({ message: 'Bookmark updated', bookmark: existingBookmark });
    }
    
    // Create new bookmark
    const bookmark = new Bookmark({
      user: userId,
      video: videoId,
      notes,
      collectionName: collectionName || 'Default'
    });
    
    await bookmark.save();
    
    // Clear related cache
    await clearCacheByPattern(`${CACHE_KEYS.VIDEO}${videoId}:${userId}`);
    await clearCacheByPattern(`${CACHE_KEYS.FEED}*:${userId}`);
    
    res.status(201).json({ message: 'Video bookmarked', bookmark });
  } catch (error) {
    console.error('Error bookmarking video:', error);
    res.status(500).json({ message: 'Error bookmarking video', error: error.message });
  }
};

/**
 * Remove a bookmark
 * @route DELETE /api/videos/:id/bookmark
 * @access Private
 */
export const removeBookmark = async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const userId = req.user._id;
    
    // Delete the bookmark
    const result = await Bookmark.findOneAndDelete({ 
      user: userId, 
      video: videoId 
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    // Clear related cache
    await clearCacheByPattern(`${CACHE_KEYS.VIDEO}${videoId}:${userId}`);
    await clearCacheByPattern(`${CACHE_KEYS.FEED}*:${userId}`);
    
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Error removing bookmark', error: error.message });
  }
};

/**
 * Get user's bookmarks
 * @route GET /api/videos/bookmarks
 * @access Private
 */
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Parse and validate pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1); // Ensure page is at least 1
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); // Between 1 and 50
    const skip = (page - 1) * limit;
    
    const collection = req.query.collection;
    
    // Build query
    const query = { user: userId };
    
    if (collection) {
      query.collectionName = collection;
    }
    
    // Find bookmarks with populated video data
    const bookmarks = await Bookmark.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'video',
        populate: [
          { path: 'creator', select: 'name profilePicture' },
          { path: 'categories', select: 'name icon color' }
        ]
      });
    
    // Filter out bookmarks with null videos (videos that might have been deleted)
    const validBookmarks = bookmarks.filter(bookmark => bookmark.video !== null);
    
    const total = await Bookmark.countDocuments(query);
    
    res.json({
      bookmarks: validBookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
};

/**
 * Get bookmark collections for user
 * @route GET /api/videos/bookmark-collections
 * @access Private
 */
export const getBookmarkCollections = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Use aggregation to get distinct collections and counts
    const collections = await Bookmark.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$collectionName', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(collections);
  } catch (error) {
    console.error('Error fetching bookmark collections:', error);
    res.status(500).json({ message: 'Error fetching bookmark collections', error: error.message });
  }
};

// Upload video
export const uploadVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No video file uploaded', 400));
  }

  // Convert absolute path to relative path for storage
  const relativePath = path.basename(req.file.path);
  console.log('File upload path:', {
    original: req.file.path,
    relative: relativePath
  });

  const videoData = {
    title: req.body.title,
    description: req.body.description,
    creator: req.user._id, // Assuming user is attached by auth middleware
    videoFile: relativePath, // Store only the filename, not the full path
    categories: req.body.categories ? JSON.parse(req.body.categories) : [],
    tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    isPublished: req.body.isPublished === 'false' ? false : true,
    allowComments: req.body.allowComments === 'false' ? false : true
  };

  const video = await Video.create(videoData);
  console.log('Created video record:', JSON.stringify(video, null, 2));

  res.status(201).json({
    status: 'success',
    data: {
      video
    }
  });
});

// Get all videos with pagination
export const getAllVideos = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const videos = await Video.find({ isPublished: true })
    .populate('creator', 'name avatar')
    .populate('categories', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Video.countDocuments({ isPublished: true });

  res.status(200).json({
    status: 'success',
    results: videos.length,
    data: {
      videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVideos: total
      }
    }
  });
});

// Get single video
export const getVideo = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id)
    .populate('creator', 'name avatar')
    .populate('categories', 'name');

  if (!video) {
    return next(new AppError('No video found with that ID', 404));
  }

  // Increment views
  video.views += 1;
  await video.save();

  res.status(200).json({
    status: 'success',
    data: {
      video
    }
  });
}); 