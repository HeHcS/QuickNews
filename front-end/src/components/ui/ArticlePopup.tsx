import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Helper function for responsive sizing based on viewport height
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

interface ArticlePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  videoId?: string; // Add videoId prop
  videoCreator?: {
    name: string;
    avatar?: string;
    handle?: string;
  };
}

export default function ArticlePopup({ isOpen, onClose, title, content, videoId, videoCreator }: ArticlePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [articleTitle, setArticleTitle] = useState(title);
  const [articleContent, setArticleContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articleData, setArticleData] = useState<any | null>(null);

  // Fetch article data when the popup opens
  useEffect(() => {
    if (isOpen && videoId) {
      fetchArticleData(videoId);
    }
  }, [isOpen, videoId]);

  // Function to fetch article data from the backend
  const fetchArticleData = async (videoId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(API_ENDPOINTS.ARTICLES.BY_VIDEO(videoId));
      
      if (response.data && response.data.status === 'success' && response.data.article) {
        // If article data is found, update the state
        setArticleTitle(response.data.article.title);
        setArticleContent(response.data.article.content);
        setArticleData(response.data.article); // Store the full article data
      } else {
        // If no article is found, fall back to video title and description
        setArticleTitle(title);
        setArticleContent(content);
        setArticleData(null);
      }
    } catch (error: any) {
      console.error('Error fetching article data:', error);
      // Fall back to video title and description on error
      setArticleTitle(title);
      setArticleContent(content);
      setArticleData(null);
      
      // Only show error if it's not a 404 (no article found)
      if (error.response && error.response.status !== 404) {
        setError('Failed to load article content');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // First set visible to true to render the component
      setIsVisible(true);
      setIsClosing(false);
      
      // Add a small delay before starting the animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to ensure the component is rendered first
      
      return () => clearTimeout(timer);
    } else if (isVisible) {
      // Start closing animation
      setIsAnimating(false);
      setIsClosing(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with the transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  // Reset to default values when closed
  useEffect(() => {
    if (!isOpen) {
      setArticleTitle(title);
      setArticleContent(content);
    }
  }, [isOpen, title, content]);

  if (!isVisible) return null;

  const handleClose = () => {
    // Start closing animation
    setIsAnimating(false);
    setIsClosing(true);
    
    setTimeout(() => {
      onClose();
    }, 300); // Match this with the transition duration
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className={`relative w-auto h-screen max-h-screen aspect-[9/16] bg-[#0A0A0A]/80 backdrop-blur-sm text-white overflow-y-auto scrollbar-hide rounded-3xl transition-all duration-300 ${
          isAnimating ? 'translate-y-0 scale-100' : 'translate-y-full scale-95'
        }`}
      >
        {/* Back button - stays fixed */}
        <button 
          onClick={handleClose}
          className="fixed top-4 left-4 sm:left-4 z-50 flex items-center text-white/90 hover:text-white"
          style={{ padding: `${getResponsiveSize(4)} ${getResponsiveSize(8)}` }}
        >
          <span style={{ fontSize: getResponsiveSize(16), marginRight: getResponsiveSize(8) }}>←</span>
          <span style={{ fontSize: getResponsiveSize(12) }}>Back</span>
        </button>

        <div style={{ padding: `0 ${getResponsiveSize(16)}`, paddingTop: getResponsiveSize(64) }}>
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-500/20 text-white p-4 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Title */}
              <h1 style={{ fontSize: getResponsiveSize(28), marginBottom: getResponsiveSize(8) }} className="font-bold leading-tight">{articleTitle}</h1>
              
              {/* Subtitle */}
              <p style={{ fontSize: getResponsiveSize(16), marginBottom: getResponsiveSize(16), color: 'rgba(255, 255, 255, 0.7)' }} className="font-medium">
                A comprehensive look at the latest developments and what they mean for our future
              </p>

              {/* Source and date */}
              <div style={{ marginBottom: getResponsiveSize(16) }} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={videoCreator?.avatar 
                      ? `${API_ENDPOINTS.STATIC.PROFILES}/${videoCreator.avatar}` 
                      : "https://picsum.photos/seed/dailymail/32/32"}
                    alt={videoCreator?.name || "Source"}
                    style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}
                    className="rounded-full"
                  />
                  <div className="flex flex-col justify-center">
                    <span style={{ fontSize: getResponsiveSize(12) }} className="text-white/70">
                      {videoCreator?.name || "Unknown Creator"}
                    </span>
                    <span style={{ fontSize: getResponsiveSize(11) }} className="text-white/50">
                      @{videoCreator?.handle || 
                         videoCreator?.name?.toLowerCase().replace(/\s+/g, '') || 
                         "unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontSize: getResponsiveSize(12) }} className="text-[#FFB800]">Published on</span>
                  <span style={{ fontSize: getResponsiveSize(12) }} className="text-[#FFB800]">
                    {articleData?.createdAt 
                      ? new Date(articleData.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric'
                        }) 
                      : "Recent"}
                  </span>
                </div>
              </div>

              {/* Featured Image with Caption */}
              <div style={{ marginBottom: getResponsiveSize(16), position: 'relative' }} className="w-full aspect-video bg-blue-600">
                <img
                  src="https://picsum.photos/seed/nato/800/450"
                  alt="Article Featured Image"
                  className="w-full h-full object-cover"
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  padding: getResponsiveSize(8),
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  fontSize: getResponsiveSize(10),
                  color: 'rgba(255,255,255,0.7)',
                  zIndex: 1
                }}>
                  {articleTitle}
                </div>
              </div>

              {/* Content */}
              <div style={{ paddingBottom: getResponsiveSize(96) }} className="space-y-6">
                {/* Main Article Content */}
                <section>
                  <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6' }} className="leading-relaxed text-white/80 whitespace-pre-line">
                    {articleContent}
                  </p>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 