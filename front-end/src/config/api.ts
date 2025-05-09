/**
 * API Configuration
 * 
 * This file contains configuration for API endpoints.
 * It uses environment variables with fallbacks for local development.
 */

// Get the API base URL from environment variables or use default
const API_BASE_URL = 
  typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000')
    : (process.env.API_BASE_URL || 'http://localhost:5000');

// API endpoint paths
const API_ENDPOINTS = {
  // Video routes
  VIDEOS: {
    FEED: `${API_BASE_URL}/api/videos/feed`,
    STREAM: (videoId: string) => `${API_BASE_URL}/api/videos/${videoId}/stream`,
    CREATOR: (creatorId: string) => `${API_BASE_URL}/api/videos/creator/${creatorId}`,
  },
  
  // User/Profile routes
  PROFILE: {
    BY_HANDLE: (handle: string) => `${API_BASE_URL}/api/profile/handle/${handle}`,
  },
  
  // Engagement routes
  ENGAGEMENT: {
    COMMENTS: `${API_BASE_URL}/api/engagement/comments`,
  },
  
  // Article routes
  ARTICLES: {
    BY_VIDEO: (videoId: string) => `${API_BASE_URL}/api/articles/video/${videoId}`,
  },
  
  // Static content
  STATIC: {
    PROFILES: `${API_BASE_URL}/uploads/profiles`,
    THUMBNAILS: `${API_BASE_URL}/uploads/thumbnails`,
    DEFAULT_PROFILE: `${API_BASE_URL}/uploads/profiles/default-profile.png`,
  }
};

export { API_BASE_URL, API_ENDPOINTS }; 