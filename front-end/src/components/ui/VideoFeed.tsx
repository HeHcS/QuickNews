'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Comments from './Comments';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import ArticlePopup from './ArticlePopup';

interface Video {
  id: string;
  videoFile: string;  // This will be the full URL from the database
  title: string;
  creator: {
    name: string;
    avatar?: string;
  };
  likes: number;
  comments: number;
  headline?: {
    text: string;
    source: string;
    timestamp: string;
  };
  captions?: {
    title: string;
    text: string;
  };
}

interface VideoPostProps {
  video: Video;
  isActive: boolean;
  isCommentsOpen: boolean;
  onCommentsOpenChange: (isOpen: boolean) => void;
  isArticleOpen: boolean;
  onArticleOpenChange: (isOpen: boolean) => void;
}

interface VideoFeedProps {
  page?: number;
  limit?: number;
}

const sampleComments: { [key: string]: Array<{
  id: string;
  user: { name: string; avatar: string };
  text: string;
  likes: number;
  timestamp: string;
}> } = {
  'foryou-1': [
    {
      id: '1',
      user: {
        name: 'Alice Chen',
        avatar: 'https://picsum.photos/seed/alice/100/100',
      },
      text: 'This is amazing! The cinematography is on another level 🔥 Been waiting for content like this!',
      likes: 842,
      timestamp: '2h ago',
    },
    {
      id: '2',
      user: {
        name: 'Bob Smith',
        avatar: 'https://picsum.photos/seed/bob/100/100',
      },
      text: 'The lighting in this shot is perfect 👏 What camera setup did you use?',
      likes: 324,
      timestamp: '1h ago',
    }
  ],
  'foryou-2': [
    {
      id: '1',
      user: {
        name: 'Michael Brown',
        avatar: 'https://picsum.photos/seed/michael/100/100',
      },
      text: 'First time seeing your content and I\'m already hooked! 🎬 Instant follow!',
      likes: 423,
      timestamp: '1h ago',
    },
    {
      id: '2',
      user: {
        name: 'Sophie Taylor',
        avatar: 'https://picsum.photos/seed/sophie/100/100',
      },
      text: 'The way you transition between scenes is so smooth ✨ Need a tutorial on this!',
      likes: 267,
      timestamp: '45m ago',
    }
  ],
  'foryou-3': [
    {
      id: '1',
      user: {
        name: 'Emma Watson',
        avatar: 'https://picsum.photos/seed/emma/100/100',
      },
      text: '0:45 is literally the best part! Had to watch it multiple times 😍',
      likes: 567,
      timestamp: '45m ago',
    },
    {
      id: '2',
      user: {
        name: 'David Kim',
        avatar: 'https://picsum.photos/seed/david/100/100',
      },
      text: 'Been following your work for months, and you keep getting better! Any tips for aspiring creators?',
      likes: 231,
      timestamp: '20m ago',
    }
  ],
  'breaking-1': [
    {
      id: '1',
      user: {
        name: 'Sarah Johnson',
        avatar: 'https://picsum.photos/seed/sarah/100/100',
      },
      text: '🎵 Does anyone know the background music? It\'s so good!',
      likes: 142,
      timestamp: '5m ago',
    }
  ],
  'following-1': [
    {
      id: '1',
      user: {
        name: 'James Wilson',
        avatar: 'https://picsum.photos/seed/james/100/100',
      },
      text: 'This gives me such nostalgic vibes 🌟 Reminds me of old school cinematography but with a modern twist',
      likes: 189,
      timestamp: '30m ago',
    }
  ],
  'politics-1': [
    {
      id: '1',
      user: {
        name: 'Michael Brown',
        avatar: 'https://picsum.photos/seed/michael/100/100',
      },
      text: 'First time seeing your content and I\'m already hooked! 🎬 Instant follow!',
      likes: 423,
      timestamp: '1h ago',
    }
  ],
  'tech-1': [
    {
      id: '1',
      user: {
        name: 'Sophie Taylor',
        avatar: 'https://picsum.photos/seed/sophie/100/100',
      },
      text: 'The future of tech is looking bright! 🚀',
      likes: 345,
      timestamp: '2h ago',
    }
  ],
  'business-1': [
    {
      id: '1',
      user: {
        name: 'James Wilson',
        avatar: 'https://picsum.photos/seed/james/100/100',
      },
      text: 'Great insights on market trends! 📈',
      likes: 278,
      timestamp: '1h ago',
    }
  ],
  // Add more comments for other videos...
};

const generateVideoContent = (videoFile: string | undefined) => {
  if (!videoFile) {
    return {
      title: 'Content Unavailable',
      text: 'This content is currently unavailable.'
    };
  }

  const filename = videoFile.split('/').pop()?.replace('.mp4', '') || '';
  
  // Define content templates based on video source
  const contentTemplates: { [key: string]: { title: string; text: string } } = {
    'bbcnewsvideo1': {
      title: 'Breaking: Major Climate Agreement Reached',
      text: 'World leaders have reached a historic agreement on climate change at the latest UN summit. The groundbreaking deal includes ambitious targets for reducing global emissions and establishes a new framework for international cooperation. This marks a significant step forward in the global fight against climate change, with nations committing to specific actionable goals.'
    },
    'dailymailvideo1': {
      title: 'Exclusive: Inside the Royal Family\'s New Initiative',
      text: 'The Royal Family has launched a groundbreaking environmental campaign, setting new standards for sustainable living. This exclusive report takes you behind the scenes of their latest green initiative, showing how the monarchy is adapting to modern environmental challenges.'
    },
    'dailymailvideo2': {
      title: 'Celebrity Charity Event Raises Millions',
      text: 'Hollywood\'s biggest stars came together for an unprecedented charity gala, raising millions for global education initiatives. The star-studded event featured exclusive performances and surprise announcements that will impact communities worldwide.'
    },
    'dylanpagevideo1': {
      title: 'Behind the Scenes: A Day in Tech Valley',
      text: 'Join me as I explore the latest innovations in Silicon Valley. From cutting-edge startups to tech giants, we\'re getting an exclusive look at what\'s shaping our digital future. The energy here is incredible, and the innovations we\'re seeing are going to change the way we live and work.'
    },
    'dylanpagevideo2': {
      title: 'The Future of Electric Vehicles: What\'s Next?',
      text: 'Taking a deep dive into the revolutionary changes happening in the electric vehicle industry. From new battery technology to autonomous driving features, we\'re exploring how these innovations are reshaping transportation for the next generation.'
    }
  };

  return contentTemplates[filename] || {
    title: 'Latest Update',
    text: 'Stay tuned for more exciting content and updates.'
  };
};

function VideoPost({ video, isActive, isCommentsOpen, onCommentsOpenChange, isArticleOpen, onArticleOpenChange }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCaptionsExpanded, setIsCaptionsExpanded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.7,
  });

  // Reset states when video changes or becomes inactive
  useEffect(() => {
    setIsLiked(false);
    setIsCaptionsExpanded(false);
  }, [video.id, isActive]);

  // Generate content based on video file
  const videoContent = generateVideoContent(video?.videoFile);

  // Early return if video data is invalid
  if (!video || !video.videoFile) {
    return (
      <div ref={ref} className="relative h-[700px] w-full snap-start bg-black flex items-center justify-center">
        <div className="text-white text-center p-4">
          <p className="text-xl font-bold mb-2">Video Unavailable</p>
          <p className="text-sm opacity-80">This content could not be loaded.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;

    if (isActive && inView) {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isActive, inView]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full h-full snap-start bg-black">
      {/* Video Layer */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          togglePlay(e);
        }}
      >
      <video
        ref={videoRef}
        src={video.videoFile} // Directly use the videoFile URL from the database
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-contain bg-black"
        />
        {/* Bottom Gradient Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-500 ease-in-out ${
            isCaptionsExpanded ? 'h-[300px]' : 'h-[200px]'
          }`}
        />
      </div>
      
      {/* Video Info Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Captions Section */}
        <div className="absolute bottom-[112px] left-0 right-[50px] p-4 text-white pointer-events-auto">
          <h2 className="text-xl font-bold mb-3 -mr-[50px]">{videoContent.title}</h2>
          <div className="relative">
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isCaptionsExpanded ? 'h-auto' : 'h-[48px]'
            }`}>
              <p className="text-xs leading-relaxed">
                {videoContent.text}
              </p>
            </div>
            {videoContent.text.length > 150 && (
              <div className="relative mt-1 bg-transparent">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsCaptionsExpanded(!isCaptionsExpanded);
                  }}
                  className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-all duration-500 ease-in-out"
                >
                  {isCaptionsExpanded ? 'Show less' : 'Read more'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-[70px] left-0 right-0 p-2.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
          <img
            src={video.creator.avatar || '/default-avatar.png'}
            alt={video.creator.name}
                className="w-10 h-10 rounded-full border border-white/20"
              />
              <div>
                <h3 className="font-semibold text-sm leading-tight">{video.creator.name}</h3>
                <h4 className="text-white/70 text-[10px] leading-tight">@{video.creator.name.toLowerCase().replace(/\s+/g, '')}</h4>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="pointer-events-auto px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors"
              >
                Subscribe
              </button>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onArticleOpenChange(true);
              }}
              className="pointer-events-auto px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors"
            >
              Full Article
            </button>
          </div>
      </div>

        {/* Engagement Buttons */}
        <div className="absolute bottom-[160px] right-4 flex flex-col space-y-4 pointer-events-auto">
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isLiked ? '❤️' : '🤍'}
            </button>
            <span className="text-white text-xs mt-1">{isLiked ? video.likes + 1 : video.likes}</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCommentsOpenChange(!isCommentsOpen);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              💬
            </button>
            <span className="text-white text-xs mt-1">{video.comments}</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              🔗
            </button>
            <span className="text-white text-xs mt-1">Share</span>
          </div>
        </div>

        {/* Play/Pause Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white">
              <span className="text-2xl">▶️</span>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}

export default function VideoFeed() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [hasOpenComments, setHasOpenComments] = useState(false);
  const [hasOpenArticle, setHasOpenArticle] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  
  // Define categories in the same order as TopNav
  const categories = ['Breaking', 'Politics', 'For You', 'Tech', 'Business', 'Following'];
  
  // Determine current category based on pathname
  const currentCategory = pathname === '/' || pathname === '/foryou' ? 'For You' : 
    pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Only send category if it's a valid MongoDB ObjectId
        const params = currentCategory === 'For You' ? {} : 
          /^[0-9a-fA-F]{24}$/.test(currentCategory) ? { category: currentCategory } : {};
        
        console.log('Fetching videos with params:', params);
        console.log('Current category:', currentCategory);
        
        // Fetch videos from backend
        const response = await axios.get('http://localhost:5000/api/videos/feed', {
          params,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Raw video feed response:', response.data);

        // Check if response has the videos array
        if (response.data && Array.isArray(response.data.videos)) {
          // Map the response to include full video URLs
          const videosWithUrls = response.data.videos.map((video: any) => ({
            ...video,
            videoFile: `http://localhost:5000/api/videos/${video._id}/stream`
          }));
          setVideos(videosWithUrls);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err: any) {
        let errorMessage = 'Failed to fetch videos';
        
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.response) {
          // Server responded with error
          errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
          console.log('Server error response:', err.response.data);
        } else if (err.request) {
          // Request made but no response
          errorMessage = 'Could not connect to server. Please check if the server is running.';
          console.log('No response received:', err.request);
        } else {
          // Other errors
          errorMessage = err.message || 'An unexpected error occurred';
          console.log('Other error:', err);
        }
        
        setError(errorMessage);
        console.error('Error fetching videos:', {
          code: err.code,
          status: err.response?.status,
          message: errorMessage,
          error: err
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [currentCategory]);

  // Add debug log for videos state changes
  useEffect(() => {
    console.log('Videos state updated:', videos);
  }, [videos]);

  // Add debug log for loading state changes
  useEffect(() => {
    console.log('Loading state:', isLoading);
  }, [isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasOpenComments || hasOpenArticle) return; // Prevent scrolling when comments or article are open
    const element = e.currentTarget;
    const newIndex = Math.round(element.scrollTop / element.clientHeight);
    if (newIndex !== activeVideoIndex) {
      setActiveVideoIndex(newIndex);
    }
  };

  const handleCategoryChange = (newIndex: number) => {
    if (hasOpenComments || hasOpenArticle) return; // Prevent category change if comments or article are open
  
    const currentIndex = categories.indexOf(currentCategory);
    
    if (newIndex !== currentIndex) {
      const newCategory = categories[newIndex];
      // Special handling for For You page
      if (newCategory === 'For You') {
        router.push('/foryou');
      } else {
        router.push(`/${newCategory.toLowerCase()}`);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (hasOpenComments || hasOpenArticle) return; // Prevent touch start if comments or article are open
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    const currentX = e.touches[0].clientX;
    setDragOffset(currentX - (touchStart || 0));
  };

  const handleTouchEnd = () => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;

    const threshold = 50; // Minimum distance to trigger category change
    const currentIndex = categories.indexOf(currentCategory);
    let newIndex = currentIndex;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        // Dragged right - go to previous category
        newIndex = currentIndex - 1;
      } else if (dragOffset < 0 && currentIndex < categories.length - 1) {
        // Dragged left - go to next category
        newIndex = currentIndex + 1;
      }
    }

    handleCategoryChange(newIndex);

    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasOpenComments || hasOpenArticle) return; // Prevent mouse down if comments or article are open
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    const currentX = e.clientX;
    setDragOffset(currentX - (touchStart || 0));
  };

  const handleMouseUp = () => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;

    const threshold = 50; // Minimum distance to trigger category change
    const currentIndex = categories.indexOf(currentCategory);
    let newIndex = currentIndex;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        // Dragged right - go to previous category
        newIndex = currentIndex - 1;
      } else if (dragOffset < 0 && currentIndex < categories.length - 1) {
        // Dragged left - go to next category
        newIndex = currentIndex + 1;
      }
    }

    handleCategoryChange(newIndex);

    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
  };

  if (isLoading) {
    return (
      <div className="relative h-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-full flex items-center justify-center bg-black">
        <div className="text-white text-center p-4">
          <p className="text-red-500 mb-2">⚠️ Error loading videos</p>
          <p className="text-sm opacity-80">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TopNav />
      
      {/* Video Feed */}
      <div 
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: isDragging ? 'grabbing' : 'default',
          pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto'
        }}
      >
        {videos.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-black text-white text-center p-4">
            <p>No videos available for this category</p>
          </div>
        ) : (
          videos.map((video, index) => (
            <VideoPost
              key={video.id}
              video={video}
              isActive={index === activeVideoIndex}
              isCommentsOpen={hasOpenComments}
              onCommentsOpenChange={setHasOpenComments}
              isArticleOpen={hasOpenArticle}
              onArticleOpenChange={setHasOpenArticle}
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{ pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto' }}>
        <BottomNav />
      </div>

      {/* Comments Component */}
      {videos[activeVideoIndex] && (
        <Comments 
          isOpen={hasOpenComments}
          onClose={() => setHasOpenComments(false)}
          comments={sampleComments[videos[activeVideoIndex].id] || []}
        />
      )}

      {/* Article Popup */}
      {videos[activeVideoIndex] && (
        <ArticlePopup 
          isOpen={hasOpenArticle}
          onClose={() => setHasOpenArticle(false)}
          title={generateVideoContent(videos[activeVideoIndex].videoFile).title}
          content={generateVideoContent(videos[activeVideoIndex].videoFile).text}
        />
      )}
    </div>
  );
} 