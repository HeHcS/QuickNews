'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Comments from './Comments';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ArticlePopup from './ArticlePopup';
import Link from 'next/link';
import { Heart, Share2, Play, Pause } from 'lucide-react';
import Image from 'next/image';

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

// Sample videos data
const sampleVideos: { [key: string]: Video[] } = {
  Breaking: [
    {
      id: 'breaking-1',
      videoFile: '/VidAssets/bbcnewsvideo1.mp4',
      title: 'Breaking: Latest News Update 📰',
      creator: {
        name: 'BBC News',
        avatar: 'https://picsum.photos/seed/bbc1/100/100',
      },
      likes: 1234,
      comments: 89
    }
  ],
  Following: [
    {
      id: 'following-1',
      videoFile: '/VidAssets/dylanpagevideo1.mp4',
      title: 'From Your Favorite Creator 🌟',
      creator: {
        name: 'Dylan Page',
        avatar: 'https://picsum.photos/seed/dylan1/100/100',
      },
      likes: 2345,
      comments: 156
    }
  ],
  'For You': [
    {
      id: 'foryou-1',
      videoFile: '/VidAssets/dailymailvideo1.mp4',
      title: 'Daily Mail Latest 📰',
      creator: {
        name: 'Daily Mail',
        avatar: 'https://picsum.photos/seed/dailymail1/100/100',
      },
      likes: 1234,
      comments: 89
    },
    {
      id: 'foryou-2',
      videoFile: '/VidAssets/dylanpagevideo2.mp4',
      title: 'Dylan Page Latest 🎬',
      creator: {
        name: 'Dylan Page',
        avatar: 'https://picsum.photos/seed/dylan2/100/100',
      },
      likes: 2345,
      comments: 156
    },
    {
      id: 'foryou-3',
      videoFile: '/VidAssets/dailymailvideo2.mp4',
      title: 'Daily Mail Update 📽️',
      creator: {
        name: 'Daily Mail',
        avatar: 'https://picsum.photos/seed/dailymail2/100/100',
      },
      likes: 3456,
      comments: 234
    }
  ],
  Politics: [
    {
      id: 'politics-1',
      videoFile: '/VidAssets/bbcnewsvideo1.mp4',
      title: 'Latest Political Update 🏛️',
      creator: {
        name: 'BBC News',
        avatar: 'https://picsum.photos/seed/bbc2/100/100',
      },
      likes: 3456,
      comments: 234
    }
  ],
  Tech: [
    {
      id: 'tech-1',
      videoFile: '/VidAssets/dylanpagevideo1.mp4',
      title: 'Latest Tech Innovation 💻',
      creator: {
        name: 'Dylan Page',
        avatar: 'https://picsum.photos/seed/dylan3/100/100',
      },
      likes: 5678,
      comments: 342
    }
  ],
  Business: [
    {
      id: 'business-1',
      videoFile: '/VidAssets/dailymailvideo2.mp4',
      title: 'Business Insights 📈',
      creator: {
        name: 'Daily Mail',
        avatar: 'https://picsum.photos/seed/dailymail3/100/100',
      },
      likes: 4567,
      comments: 278
    }
  ]
};

// Sample comments data
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

// Helper function for responsive sizing based on viewport height
const clamp = (min: number, val: number, max: number): number => {
  return Math.min(Math.max(min, val), max);
};

// Calculate responsive sizes based on viewport height (700px reference)
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

// Add this at the top of the file, after imports
const currentlyPlayingVideoRef = { current: null as HTMLVideoElement | null };

function VideoPost({ video, isActive, isCommentsOpen, onCommentsOpenChange, isArticleOpen, onArticleOpenChange }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'phase1' | 'phase2' | 'phase3'>('idle');
  const [isCaptionsExpanded, setIsCaptionsExpanded] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPlayPauseFading, setIsPlayPauseFading] = useState(false);
  const playPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.7,
  });

  // Double tap to like states
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState({ x: 0, y: 0 });
  
  // Double tap detection refs
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDoubleTapRef = useRef<boolean>(false);

  // Add seek bar related state and refs
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeekbarDragging, setIsSeekbarDragging] = useState(false);
  const seekbarRef = useRef<HTMLDivElement>(null);

  // Reset states when video changes or becomes inactive
  useEffect(() => {
    setIsLiked(false);
    setIsCaptionsExpanded(false);
    // Clear any pending pause timeout
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
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

  // Handle video playback based on visibility
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;

    if (isActive && inView) {
      // If there's another video playing, pause it first
      if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== videoElement) {
        currentlyPlayingVideoRef.current.pause();
      }
      
      // Set this as the currently playing video
      currentlyPlayingVideoRef.current = videoElement;
      
      // Force autoplay when active and in view
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoElement.pause();
      setIsPlaying(false);
      
      // If this was the currently playing video, clear the reference
      if (currentlyPlayingVideoRef.current === videoElement) {
        currentlyPlayingVideoRef.current = null;
      }
    }
  }, [isActive, inView]);

  // Force autoplay when component mounts
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    // If there's another video playing, pause it first
    if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== videoElement) {
      currentlyPlayingVideoRef.current.pause();
    }
    
    // Only set this as the currently playing video and autoplay if it's active
    if (isActive) {
      // Set this as the currently playing video
      currentlyPlayingVideoRef.current = videoElement;
      
      // Force autoplay on mount
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      // Make sure it's paused if not active
      videoElement.pause();
      setIsPlaying(false);
    }
    
    // Add event listener for when video is loaded
    const handleLoadedData = () => {
      // If there's another video playing, pause it first
      if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== videoElement) {
        currentlyPlayingVideoRef.current.pause();
      }
      
      // Only set this as the currently playing video and autoplay if it's active
      if (isActive) {
        // Set this as the currently playing video
        currentlyPlayingVideoRef.current = videoElement;
        
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        // Make sure it's paused if not active
        videoElement.pause();
        setIsPlaying(false);
      }
    };
    
    videoElement.addEventListener('loadeddata', handleLoadedData);
    
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      
      // If this was the currently playing video, clear the reference
      if (currentlyPlayingVideoRef.current === videoElement) {
        currentlyPlayingVideoRef.current = null;
      }
    };
  }, [isActive]);

  // Handle screen tap for play/pause
  const handleScreenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Clear existing timeouts
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    
    // Reset fade state and show button
    setIsPlayPauseFading(false);
    setShowPlayPause(true);
    
    // Start fade out after 1 second
    playPauseTimeoutRef.current = setTimeout(() => {
      setIsPlayPauseFading(true);
      
      // Hide button after fade animation completes
      fadeTimeoutRef.current = setTimeout(() => {
        setShowPlayPause(false);
        setIsPlayPauseFading(false);
      }, 500); // Match this with CSS transition duration
        }, 1000);
        
    // Toggle play/pause
    togglePlay(e);
  };

  const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    const video = videoRef.current;
    if (!video) return;

    // Clear any pending pause timeout to prevent conflicts
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }

    if (video.paused) {
      // If there's another video playing, pause it first
      if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== video) {
        currentlyPlayingVideoRef.current.pause();
      }
      
      // Set this as the currently playing video
      currentlyPlayingVideoRef.current = video;
      
      // Play the video immediately
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsPlayPauseFading(false);
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      // Pause the video immediately
      video.pause();
      setIsPlaying(false);
      setIsPlayPauseFading(true);
      
      // If this was the currently playing video, clear the reference
      if (currentlyPlayingVideoRef.current === video) {
        currentlyPlayingVideoRef.current = null;
      }
    }
  };

  const toggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Start animation sequence
    setAnimationPhase('phase1');
    setShowSparkles(true);
    
    // After first phase, change the state
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setAnimationPhase('phase2');
      
      // After second phase, add bounce
      setTimeout(() => {
        setAnimationPhase('phase3');
        
        // After bounce, reset to idle
        setTimeout(() => {
          setAnimationPhase('idle');
          setShowSparkles(false);
        }, 200);
      }, 150);
    }, 100);
  };

  // Get animation classes based on current phase
  const getAnimationClasses = () => {
    if (animationPhase === 'idle') {
      return isFollowing 
        ? 'bg-white/20 text-white border border-white/30' 
        : 'bg-[#29ABE2] text-white';
    }
    
    if (animationPhase === 'phase1') {
      return isFollowing
        ? 'bg-[#29ABE2] text-white scale-95 rotate-[-3deg]'
        : 'bg-white/20 text-white border border-white/30 scale-95 rotate-[3deg]';
    }
    
    if (animationPhase === 'phase2') {
      return isFollowing
        ? 'bg-white/20 text-white border border-white/30 scale-105 rotate-[3deg]'
        : 'bg-[#29ABE2] text-white scale-105 rotate-[-3deg]';
    }
    
    // phase3 (bounce)
    return isFollowing
      ? 'bg-white/20 text-white border border-white/30 scale-100 rotate-0'
      : 'bg-[#29ABE2] text-white scale-100 rotate-0';
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (playPauseTimeoutRef.current) {
        clearTimeout(playPauseTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full snap-start bg-black"
      style={{ touchAction: 'none' }}
      onClick={handleScreenTap}
    >
      {/* Video Layer - Lowest z-index */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={video.videoFile}
            loop
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        </div>
        {/* Bottom Gradient Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-500 ease-in-out ${
            isCaptionsExpanded ? 'h-[300px]' : 'h-[200px]'
          }`}
        />
      </div>
      
      {/* Double Tap Heart Animation - Highest z-index */}
      {showDoubleTapHeart && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute" style={{ left: `${doubleTapPosition.x}px`, top: `${doubleTapPosition.y}px`, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className="absolute inset-0 animate-pulse bg-[#29ABE2]/30 rounded-full blur-xl" style={{ width: '100px', height: '100px' }} />
              <div className="relative z-10">
                <div className="animate-double-tap-heart" style={{ '--animation-delay': '0s' } as React.CSSProperties}>
                  <Heart className="w-[100px] h-[100px] text-[#29ABE2]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Interactive Elements Layer - High z-index */}
      <div className="absolute inset-0 z-50">
        {/* Play/Pause Button - Center */}
        {showPlayPause && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className={`w-16 h-16 flex items-center justify-center rounded-full bg-black/40 text-white transition-all duration-500 ease-in-out transform ${
                isPlayPauseFading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
              }`}
            >
              {isPlaying ? (
                <Pause size={32} />
              ) : (
              <Play size={32} />
          )}
        </div>
          </div>
        )}

        {/* Captions Section */}
        <div style={{ bottom: getResponsiveSize(110) }} className="absolute left-0 right-[10px] p-4 text-white">
          <h2 style={{ fontSize: getResponsiveSize(20) }} className="font-bold mb-0 select-none mt-[2%] max-w-[75%]">{videoContent.title}</h2>
          <div className="relative">
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isCaptionsExpanded ? 'max-h-[500px]' : 'line-clamp-2'
            }`}>
              <p style={{ 
                fontSize: getResponsiveSize(12),
                lineHeight: '1.5'
              }} className="select-none max-w-[85%] text-gray-300">{videoContent.text}</p>
            </div>
            <div className="relative mt-1 bg-transparent">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCaptionsExpanded(!isCaptionsExpanded);
                }}
                style={{ fontSize: getResponsiveSize(12) }}
                className="text-[#29ABE2] font-medium hover:text-[#29ABE2]/80 transition-colors"
              >
                {isCaptionsExpanded ? 'Show less' : 'Read more'}
              </button>
            </div>
          </div>
        </div>

        {/* Creator Info and Article Button */}
        <div style={{ bottom: getResponsiveSize(70) }} className="absolute left-0 right-0 p-2.5 text-white">
          <div className="flex items-center justify-between interactive-element">
            <div className="flex items-center gap-2">
              <Link
                href={`/@${video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
                className="hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem('lastVideoId', video.id);
                }}
              >
                <img
                  src={video.creator.avatar || '/default-avatar.png'}
                  alt={video.creator.name}
                  style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}
                  className="rounded-full border border-white/20"
                />
              </Link>
              <Link
                href={`/@${video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
                className="hover:opacity-90 transition-opacity block"
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem('lastVideoId', video.id);
                }}
              >
                <div>
                  <h3 style={{ fontSize: getResponsiveSize(14) }} className="font-semibold leading-tight hover:text-[#29ABE2] transition-colors flex items-center gap-1">
                    {video.creator.name}
                    <span className="text-[#29ABE2]">
                      <svg style={{ width: getResponsiveSize(12), height: getResponsiveSize(12) }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </h3>
                  <h4 style={{ fontSize: getResponsiveSize(11) }} className="text-white/70 leading-tight hover:text-[#29ABE2] transition-colors">@{video.creator.name.toLowerCase().replace(/\s+/g, '')}</h4>
                </div>
              </Link>
              <button 
                onClick={toggleFollow}
                style={{ 
                  padding: `${getResponsiveSize(4)} ${getResponsiveSize(10)}`,
                  fontSize: getResponsiveSize(12)
                }}
                className={`font-medium rounded-full hover:opacity-80 transition-all duration-300 flex items-center gap-1 relative ${getAnimationClasses()}`}
              >
                <div className="flex items-center gap-1">
                  {isFollowing ? (
                    <>
                      <span>Followed</span>
                      <svg style={{ width: getResponsiveSize(12), height: getResponsiveSize(12) }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform duration-300">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  ) : (
                    'Follow'
                  )}
                </div>
                {showSparkles && (
                  <div className="absolute -top-1 -right-1 w-2 h-2">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0 bg-yellow-400 rounded-full"></div>
                  </div>
                )}
              </button>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onArticleOpenChange(true);
              }}
              style={{ 
                padding: `${getResponsiveSize(4)} ${getResponsiveSize(10)}`,
                fontSize: getResponsiveSize(12)
              }}
              className="bg-[#29ABE2] text-white font-medium rounded-full hover:bg-[#29ABE2]/80 transition-colors"
            >
              Full Article
            </button>
          </div>
        </div>

        {/* Engagement Buttons */}
        <div style={{ gap: getResponsiveSize(16) }} className="absolute right-4 top-[calc(50%+60px)] transform -translate-y-1/2 flex flex-col">
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              style={{ width: getResponsiveSize(44), height: getResponsiveSize(44) }}
              className={`flex items-center justify-center rounded-full ${
                isLiked ? 'text-[#29ABE2]' : 'text-white'
              }`}
            >
              <div style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}>
                {isLiked ? 
                  <Heart className="text-[#29ABE2] fill-[#29ABE2] scale-125 transform transition-transform duration-300 w-full h-full" /> : 
                  <Heart className="text-white fill-white transform transition-transform duration-300 w-full h-full" />
                }
              </div>
            </button>
            <span style={{ fontSize: getResponsiveSize(12) }} className="text-white mt-1 font-medium">{isLiked ? video.likes + 1 : video.likes}</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCommentsOpenChange(!isCommentsOpen);
              }}
              style={{ width: getResponsiveSize(44), height: getResponsiveSize(44) }}
              className="flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
            >
              <div style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}>
                <Image 
                  src="/assets/Vector-12.png"
                  alt="Comments"
                  width={32}
                  height={32}
                  className="w-full h-full transform transition-transform duration-300"
                />
              </div>
            </button>
            <span style={{ fontSize: getResponsiveSize(12) }} className="text-white mt-1 font-medium">{video.comments}</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              style={{ width: getResponsiveSize(44), height: getResponsiveSize(44) }}
              className="flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
            >
              <div style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}>
                <Share2 className="w-full h-full" />
              </div>
            </button>
            <span style={{ fontSize: getResponsiveSize(12) }} className="text-white mt-1 font-medium">Share</span>
          </div>
        </div>
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeekbarDragging, setIsSeekbarDragging] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekbarRef = useRef<HTMLDivElement>(null);
  
  // Define categories in the same order as TopNav
  const categories = ['Breaking', 'Politics', 'For You', 'Tech', 'Business', 'Following'];
  
  // Determine current category based on pathname
  const currentCategory = pathname === '/' || pathname === '/foryou' ? 'For You' : 
    pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  // Add this effect to pause all videos when component mounts
  useEffect(() => {
    // Pause all videos when component mounts
    const pauseAllVideos = () => {
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => {
        video.pause();
      });
      
      // Clear the currently playing video reference
      currentlyPlayingVideoRef.current = null;
    };
    
    pauseAllVideos();
    
    // Also pause all videos when videos array changes
    return () => {
      pauseAllVideos();
    };
  }, [videos]);

  useEffect(() => {
    // Instead of fetching from server, use sample videos
    setIsLoading(true);
    setError(null);
    
    try {
      // Get videos for current category
      const categoryVideos = sampleVideos[currentCategory] || [];
      setVideos(categoryVideos);
    } catch (err: any) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCategory]);

  // Add debug log for videos state changes
  useEffect(() => {
    console.log('Videos state updated:', videos);
  }, [videos]);

  // Add debug log for loading state changes
  useEffect(() => {
    console.log('Loading state:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    const videoId = searchParams.get('v');
    if (videoId) {
      const videoIndex = videos.findIndex(v => v.id === videoId);
      if (videoIndex !== -1) {
        setCurrentVideoIndex(videoIndex);
        const videoElement = document.getElementById(`video-${videoId}`);
        if (videoElement) {
          videoElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [searchParams, videos]);

  // Update video time and duration for the active video
  useEffect(() => {
    if (!videos[activeVideoIndex]) return;
    
    // Find the video element for the active video
    const videoElement = document.querySelector(`#video-${videos[activeVideoIndex].id} video`) as HTMLVideoElement;
    if (!videoElement) return;
    
    videoRef.current = videoElement;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [activeVideoIndex, videos]);

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    const seekBar = e.currentTarget;
    const rect = seekBar.getBoundingClientRect();
    const seekPosition = (e.clientX - rect.left) / rect.width;
    
    // Set the video time based on the seek position
    videoElement.currentTime = seekPosition * videoElement.duration;
  };

  // Handle seekbar drag start
  const handleSeekbarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!videoRef.current) return;
    
    setIsSeekbarDragging(true);
    e.stopPropagation(); // Prevent other event handlers from firing
  };

  // Handle seekbar drag
  const handleSeekbarDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSeekbarDragging || !videoRef.current || !seekbarRef.current) return;
    
    const videoElement = videoRef.current;
    const seekBar = seekbarRef.current;
    const rect = seekBar.getBoundingClientRect();
    
    // Get position based on event type
    let clientX;
    if (e.type === 'touchmove') {
      clientX = (e as React.TouchEvent).touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    
    // Calculate seek position (clamped between 0 and 1)
    const seekPosition = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Set the video time based on the seek position
    videoElement.currentTime = seekPosition * videoElement.duration;
    
    e.stopPropagation(); // Prevent other event handlers from firing
  };

  // Handle seekbar drag end
  const handleSeekbarDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    setIsSeekbarDragging(false);
    e.stopPropagation(); // Prevent other event handlers from firing
  };

  // Add event listeners for seekbar dragging
  useEffect(() => {
    if (!seekbarRef.current) return;
    
    const seekbar = seekbarRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSeekbarDragging) return;
      handleSeekbarDrag(e as unknown as React.MouseEvent);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isSeekbarDragging) return;
      handleSeekbarDragEnd(e as unknown as React.MouseEvent);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isSeekbarDragging) return;
      handleSeekbarDrag(e as unknown as React.TouchEvent);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSeekbarDragging) return;
      handleSeekbarDragEnd(e as unknown as React.TouchEvent);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSeekbarDragging]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasOpenComments || hasOpenArticle) return;
    
    const element = e.currentTarget;
    const newIndex = Math.round(element.scrollTop / element.clientHeight);
    if (newIndex !== activeVideoIndex) {
      setActiveVideoIndex(newIndex);
      
      // Pause all videos first
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach(video => {
        video.pause();
      });
      
      // Clear the currently playing video reference
      currentlyPlayingVideoRef.current = null;
      
      // Force autoplay for the newly active video and reset to beginning
      setTimeout(() => {
        const videoElements = document.querySelectorAll('video');
        if (videoElements[newIndex]) {
          const videoElement = videoElements[newIndex] as HTMLVideoElement;
          videoElement.currentTime = 0; // Reset to beginning
          
          // Set this as the currently playing video
          currentlyPlayingVideoRef.current = videoElement;
          
          if (videoElement.paused) {
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Error playing video:', error);
              });
            }
          }
        }
      }, 100); // Small delay to ensure the video is ready
    }

    // Detect if we're actually scrolling vertically
    const currentScrollTop = element.scrollTop;
    const scrollDiff = Math.abs(currentScrollTop - lastScrollTop);
    setLastScrollTop(currentScrollTop);

    if (scrollDiff > 5) { // Threshold to determine if we're actually scrolling
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Set new timeout to clear scrolling state
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300); // Increased timeout for better user experience
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
    if (hasOpenComments || hasOpenArticle) return;
    
    // Store both X and Y coordinates
    setTouchStart(e.touches[0].clientX);
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
    setIsScrolling(false); // Reset scrolling state on new touch
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    // Calculate vertical and horizontal movement
    const verticalMovement = Math.abs(currentY - (touchStartY.current || 0));
    const horizontalMovement = Math.abs(currentX - (touchStart || 0));
    
    // If vertical movement is greater than horizontal, consider it a scroll
    if (verticalMovement > horizontalMovement && !isScrolling) {
      setIsScrolling(true);
      setIsDragging(false);
      return;
    }
    
    // Clear any existing timeout
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }

    // Set a new timeout to reset the drag if held too long
    dragTimeout.current = setTimeout(() => {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      touchStartY.current = null;
    }, 300); // Reduced timeout for better responsiveness
    
    // Calculate and set drag offset with a maximum limit
    const maxOffset = window.innerWidth * 0.3; // Limit drag to 30% of screen width
    const newOffset = currentX - (touchStart || 0);
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, newOffset)));
  };

  const handleTouchEnd = () => {
    if (!isDragging || hasOpenComments || hasOpenArticle || isScrolling) {
      // Reset states if conditions aren't met
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      touchStartY.current = null;
      return;
    }

    // Clear the drag timeout
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
      dragTimeout.current = null;
    }

    const threshold = 50;
    const currentIndex = categories.indexOf(currentCategory);
    let newIndex = currentIndex;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (dragOffset < 0 && currentIndex < categories.length - 1) {
        newIndex = currentIndex + 1;
      }
    }

    handleCategoryChange(newIndex);

    // Reset states with a small delay to allow for smooth transition
    setTimeout(() => {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      touchStartY.current = null;
    }, 50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasOpenComments || hasOpenArticle) return;
    
    setTouchStart(e.clientX);
    touchStartY.current = e.clientY;
    setIsDragging(true);
    setIsScrolling(false); // Reset scrolling state on new mouse down
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Calculate vertical and horizontal movement
    const verticalMovement = Math.abs(currentY - (touchStartY.current || 0));
    const horizontalMovement = Math.abs(currentX - (touchStart || 0));
    
    // If vertical movement is greater than horizontal, consider it a scroll
    if (verticalMovement > horizontalMovement && !isScrolling) {
      setIsScrolling(true);
      setIsDragging(false);
      return;
    }

    // Clear any existing timeout
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }

    // Set a new timeout to reset the drag if held too long
    dragTimeout.current = setTimeout(() => {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      touchStartY.current = null;
    }, 300); // Reduced timeout for better responsiveness
    
    // Calculate and set drag offset with a maximum limit
    const maxOffset = window.innerWidth * 0.3; // Limit drag to 30% of screen width
    const newOffset = currentX - (touchStart || 0);
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, newOffset)));
  };

  const handleMouseUp = () => {
    if (!isDragging || hasOpenComments || hasOpenArticle || isScrolling) {
      // Reset states if conditions aren't met
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    touchStartY.current = null;
      return;
    }

    // Clear the drag timeout
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
      dragTimeout.current = null;
    }

    const threshold = 50;
    const currentIndex = categories.indexOf(currentCategory);
    let newIndex = currentIndex;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (dragOffset < 0 && currentIndex < categories.length - 1) {
        newIndex = currentIndex + 1;
      }
    }

    handleCategoryChange(newIndex);

    // Reset states with a small delay to allow for smooth transition
    setTimeout(() => {
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    touchStartY.current = null;
    }, 50);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
      }
    };
  }, []);

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
            className="mt-4 px-4 py-2 bg-[#29ABE2] rounded-full hover:bg-[#29ABE2]/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-full flex flex-col items-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Video Timeline/Seekbar - Positioned above TopNav */}
      {videos.length > 0 && (
        <div 
          className="absolute top-[30px] left-0 right-0 px-4 z-50 select-none"
        >
          <div 
            ref={seekbarRef}
            className="h-1 bg-black/30 rounded-full cursor-pointer select-none"
            onClick={handleSeek}
            onMouseDown={handleSeekbarDragStart}
            onTouchStart={handleSeekbarDragStart}
          >
            <div 
              className="h-full bg-[#29ABE2] rounded-full relative transition-all duration-100 ease-out select-none"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#29ABE2] shadow-md transition-transform duration-100 ease-out transform hover:scale-125 select-none" />
            </div>
          </div>
        </div>
      )}
      
      <TopNav />
      
      {/* Video Feed */}
      <div 
        className="w-full h-[calc(100vh-120px)] mx-auto flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
        onScroll={handleScroll}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          cursor: isDragging ? 'grabbing' : 'default',
          pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto',
          touchAction: isDragging ? 'none' : 'pan-y'
        }}
      >
        {videos.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-black text-white text-center p-4">
            <p>No videos available for this category</p>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={video.id}
              id={`video-${video.id}`}
              className={`relative w-full h-full snap-start ${
                index === currentVideoIndex ? 'z-10' : 'z-0'
              }`}
            >
              <VideoPost
                video={video}
                isActive={index === activeVideoIndex}
                isCommentsOpen={hasOpenComments}
                onCommentsOpenChange={setHasOpenComments}
                isArticleOpen={hasOpenArticle}
                onArticleOpenChange={setHasOpenArticle}
              />
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="w-full mx-auto z-50" style={{ pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto' }}>
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