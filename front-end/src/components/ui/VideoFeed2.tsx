'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Comments from './Comments';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import ArticlePopup from './ArticlePopup';
import { APP_CATEGORIES } from '../../config/categories';
import Link from 'next/link';
import { Heart, Share2, Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, MessageCircle, NewspaperIcon, XIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

// Add CSS for double tap heart animation
const doubleTapHeartStyle = `
  @keyframes double-tap-heart {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    15% {
      transform: scale(1.2);
      opacity: 1;
    }
    30% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  .animate-double-tap-heart {
    animation: double-tap-heart 1s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
    animation-delay: var(--animation-delay, 0s);
  }
  /* Kawaii: Play/Pause Radial Gradient Background */
  .play-pause-gradient-bg {
    position: relative;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: none;
    overflow: visible;
  }
  .play-pause-gradient-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    z-index: 0;
    /* Soft transparent black/gray radial gradient with blur for kawaii effect */
    background: radial-gradient(circle at 60% 40%, rgba(30,30,30,0.7) 0%, rgba(30,30,30,0.4) 60%, rgba(30,30,30,0.0) 100%);
    filter: blur(16px) brightness(1.1);
    opacity: 0.85;
    transition: opacity 0.3s;
  }
`;

// Add the style to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = doubleTapHeartStyle;
  document.head.appendChild(styleElement);
}

interface Video {
  id: string;
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  likes: number;
  comments: number;
  creator: {
    name: string;
    avatar?: string;
  };
  headline?: {
    text: string;
    source: string;
    timestamp: string;
  };
}

interface Comment {
  _id: string;
  user: {
    name: string;
    profilePicture: string;
  };
  text: string;
  likes: number;
  createdAt: string;
  repliesCount: number;
  timestamp: string;
}

interface VideoPostProps {
  video: Video;
  isActive: boolean;
  isCommentsOpen: boolean;
  onCommentsOpenChange: (isOpen: boolean) => void;
  isArticleOpen: boolean;
  onArticleOpenChange: (isOpen: boolean) => void;
}

interface VideoFeed2Props {
  creatorHandle?: string;
  onClose?: () => void;
  initialVideoIndex?: number;
}

// Helper functions for responsive sizing
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
const isSeekbarDraggingRef = { current: false };

// 1. Add a custom filled, translucent pause icon component at the top (after imports)
const FilledPause = ({ size = 20, style = {} }) => {
  const px = parseInt(getResponsiveSize(size));
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="white"
      fillOpacity="0.6"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }}
    >
      <rect x="7" y="6" width="6" height="20" rx="2" />
      <rect x="19" y="6" width="6" height="20" rx="2" />
    </svg>
  );
};
// 2. Add a custom filled, translucent play icon component at the top (after FilledPause)
const FilledPlay = ({ size = 20, style = {} }) => {
  const px = parseInt(getResponsiveSize(size));
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="white"
      fillOpacity="0.6"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }}
    >
      <polygon points="10,7 26,16 10,25" rx="2" />
    </svg>
  );
};

function VideoPost({ video, isActive, isCommentsOpen, onCommentsOpenChange, onArticleOpenChange }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'phase1' | 'phase2' | 'phase3'>('idle');
  const [isCaptionsExpanded, setIsCaptionsExpanded] = useState(false);
  const [isCaptionsAnimating, setIsCaptionsAnimating] = useState(false);
  const [isCaptionsClosing, setIsCaptionsClosing] = useState(false);
  const [captionsHeight, setCaptionsHeight] = useState(0);
  const [captionsOpacity, setCaptionsOpacity] = useState(1);
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
  const dragStartX = useRef<number>(0);
  const dragStartTime = useRef<number>(0);

  // Add a new state to track the last action for the play/pause button
  const [lastAction, setLastAction] = useState<'pause' | 'play' | null>(null);

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

  // Handle screen tap for play/pause and double tap to like
  const handleScreenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we're dragging the seekbar or just finished, don't respond to general screen taps
    if (isSeekbarDragging || isSeekbarDraggingRef.current) return;
    
    // Check if the click is on the seekbar or its child elements
    // This prevents the screen tap handler from interfering with seekbar interactions
    const isSeekbarClick = e.target instanceof Element && (
      e.target.closest('[data-seekbar="true"]') !== null
    );
    
    if (isSeekbarClick) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const currentTime = Date.now();
    const tapPosition = { x: e.clientX, y: e.clientY };
    
    // Check if this is a double tap (within 400ms of the last tap)
    if (currentTime - lastTapTimeRef.current < 400) {
      // Double tap detected - like the video
      tapCountRef.current = 0;
      isDoubleTapRef.current = true;
      
      // Show heart animation at tap position
      setDoubleTapPosition(tapPosition);
      setShowDoubleTapHeart(true);
      
      // Only like the video if it's not already liked
      if (!isLiked) {
        setIsLiked(true);
      }
      
      // Hide heart animation after 1 second
      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1000);
      
      // Don't pause the video
      return;
    }
    
    // First tap - start the timer
    lastTapTimeRef.current = currentTime;
    tapCountRef.current = 1;
    
    // Clear existing timeouts
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    
    // Set a timeout to pause the video after 400ms if no second tap occurs
    setTimeout(() => {
      if (tapCountRef.current === 1) {
        // No second tap occurred, so pause the video
        if (!isSeekbarDraggingRef.current) togglePlay(e);
      }
    }, 400);
  };

  const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeekbarDraggingRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
      playPauseTimeoutRef.current = null;
    }
    if (video.paused) {
      // Play the video
      if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== video) {
        currentlyPlayingVideoRef.current.pause();
      }
      currentlyPlayingVideoRef.current = video;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setShowPlayPause(true); // Show pause icon
            setIsPlayPauseFading(false);
            setLastAction('play');
            // Fade out after 350ms (was 600ms)
            playPauseTimeoutRef.current = setTimeout(() => {
              setIsPlayPauseFading(true);
              fadeTimeoutRef.current = setTimeout(() => {
                setShowPlayPause(false);
                setIsPlayPauseFading(false);
              }, 200); // Fade duration 200ms (was 400ms)
            }, 350);
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      // Pause the video immediately
      video.pause();
      setIsPlaying(false);
      setShowPlayPause(true); // Show pause icon
      setIsPlayPauseFading(false);
      setLastAction('pause');
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

  // Update video time and duration
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
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
  }, []);

  // Update the seekbar related code
  const handleSeekbarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!videoRef.current || !seekbarRef.current) return;
    
    e.stopPropagation(); // Prevent video play/pause
    e.preventDefault(); // Prevent text selection
    
    // No longer pausing the video during drag
    setIsSeekbarDragging(true);
    isSeekbarDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    dragStartTime.current = videoRef.current.currentTime;
  };

  const handleSeekbarDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSeekbarDragging || !videoRef.current || !seekbarRef.current) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const videoElement = videoRef.current;
    const seekBar = seekbarRef.current;
    const rect = seekBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    // Calculate seek position as a percentage
    const seekPosition = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Set video time directly based on position
    videoElement.currentTime = seekPosition * videoElement.duration;
  };

  const handleSeekbarDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSeekbarDragging || !videoRef.current) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Simply end the dragging state, no need to play the video since it's already playing
    setIsSeekbarDragging(false);
    // Keep play/pause disabled for 1 second after drag ends
    setTimeout(() => {
      isSeekbarDraggingRef.current = false;
    }, 1000);
  };

  // Prevent seekbar clicks from triggering video play/pause
  const handleSeekbarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!videoRef.current || !seekbarRef.current) return;
    
    const seekBar = seekbarRef.current;
    const rect = seekBar.getBoundingClientRect();
    const seekPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Set video time directly
    videoRef.current.currentTime = seekPosition * videoRef.current.duration;
  };

  // Update the useEffect for event listeners
  useEffect(() => {
    if (!isSeekbarDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSeekbarDrag(e as unknown as React.MouseEvent);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      handleSeekbarDragEnd(e as unknown as React.MouseEvent);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      handleSeekbarDrag(e as unknown as React.TouchEvent);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      handleSeekbarDragEnd(e as unknown as React.TouchEvent);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSeekbarDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full snap-start bg-black max-w-full"
      style={{ touchAction: 'none' }}
      onClick={handleScreenTap}
    >
      {/* Video Layer - Lowest z-index */}
      <div className="absolute inset-0 z-0 max-w-full">
        <div className="absolute inset-0 max-w-full">
          <video
            ref={videoRef}
            src={video.videoFile}
            loop
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover bg-black max-w-full"
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
              <div className="absolute inset-0 animate-pulse bg-[#29ABE2] rounded-full blur-xl" style={{ width: '120px', height: '120px' }} />
              <div className="relative z-10">
                <div className="animate-double-tap-heart" style={{ '--animation-delay': '0s' } as React.CSSProperties}>
                  <Heart className="w-[100px] h-[100px] text-[#29ABE2] fill-[#29ABE2]" />
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
            {/* Kawaii: Radial gradient background for play/pause icon */}
            <div 
              className={`play-pause-gradient-bg transition-all duration-500 ease-in-out transform ${
                isPlayPauseFading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
              }`}
              style={{
                width: getResponsiveSize(40), // Responsive button size
                height: getResponsiveSize(40),
                minWidth: getResponsiveSize(20),
                minHeight: getResponsiveSize(20),
                ...((isPlayPauseFading ? { opacity: 0, transform: 'scale(0.9)' } : { opacity: 1, transform: 'scale(1)' }))
              }}
            >
              {/* Swap icons: Show Pause when playing (fade out), Play when paused (always on) */}
              {isPlaying ? (
                <FilledPause size={20} style={{ zIndex: 1 }} />
              ) : (
                <FilledPlay size={20} style={{ zIndex: 1 }} />
              )}
            </div>
          </div>
        )}

        {/* Captions Section */}
        <div 
          style={{ 
            bottom: getResponsiveSize(110),
            opacity: captionsOpacity,
            transform: isCaptionsClosing ? `translateY(${getResponsiveSize(20)})` : 'translateY(0)',
            transition: 'opacity 300ms ease-out, transform 300ms ease-out'
          }} 
          className="absolute left-0 right-[10px] p-4 text-white"
        >
          {/* Video title with badge after the text, inside the same h2! */}
          <h2 style={{ fontSize: getResponsiveSize(20) }} className="font-bold mb-0 select-none mt-[2%] max-w-[75%]">
            {video.title}
            {/* Badge appears after the title text, even if it wraps to the next line */}
            <span style={{ marginLeft: 8, verticalAlign: 'middle', marginTop: -11, display: 'inline-block' }}>
              <img
                src="/assets/QuickNewsverifiedbadge.png"
                alt="QuickNews Verified Badge"
                style={{ width: getResponsiveSize(82), height: getResponsiveSize(18), display: 'inline-block' }}
              />
            </span>
          </h2>
          <div className="relative">
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out transform ${
                isCaptionsExpanded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'
              }`}
              style={{
                maxHeight: isCaptionsExpanded ? '500px' : `${getResponsiveSize(36)}`,
                transition: 'max-height 500ms ease-in-out, transform 500ms ease-in-out, opacity 500ms ease-in-out'
              }}
            >
              <p style={{ 
                fontSize: getResponsiveSize(12),
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: isCaptionsExpanded ? 'unset' : '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }} className="select-none max-w-[85%] text-gray-300">
                {video.description}
              </p>
            </div>
            <div className="relative mt-1 bg-transparent">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCaptionsExpanded) {
                    setIsCaptionsAnimating(true);
                    setIsCaptionsClosing(false);
                    setCaptionsOpacity(1);
                    setIsCaptionsExpanded(true);
                  } else {
                    setIsCaptionsAnimating(false);
                    setIsCaptionsClosing(true);
                    setCaptionsOpacity(0);
                    setTimeout(() => {
                      setIsCaptionsExpanded(false);
                      setIsCaptionsClosing(false);
                      setCaptionsOpacity(1);
                    }, 300);
                  }
                }}
                style={{ fontSize: getResponsiveSize(12) }}
                className={`text-[#29ABE2] font-medium hover:text-[#29ABE2]/80 transition-all duration-300 select-none flex items-center gap-1 ${
                  isCaptionsAnimating ? 'scale-105 translate-y-[-2px]' : isCaptionsClosing ? 'scale-95 translate-y-[2px]' : 'scale-100 translate-y-0'
                }`}
              >
                {isCaptionsExpanded ? (
                  <>
                    Show less
                    <ChevronUp size={14} className="transition-transform duration-300" />
                  </>
                ) : (
                  <>
                    Read more
                    <ChevronDown size={14} className="transition-transform duration-300" />
                  </>
                )}
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
                  src={video.creator.avatar ? `http://localhost:5000/uploads/profiles/${video.creator.avatar}` : 'http://localhost:5000/uploads/profiles/default-profile.png'}
                  alt={video.creator.name}
                  style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}
                  className="rounded-full border border-white/20 select-none"
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
                  <h3 style={{ fontSize: getResponsiveSize(14) }} className="font-semibold leading-tight hover:text-[#29ABE2] transition-colors flex items-center gap-1 select-none">
                    {video.creator.name}
                    {/* Verified badge from Vector (1).svg - small, next to username */}
                    <span>
                      <Image 
                        src={require('../../../Quick News Assets/Vector (1).svg')}
                        alt="Verified"
                        style={{ width: getResponsiveSize(18), height: getResponsiveSize(18), display: 'inline-block', verticalAlign: 'middle' }}
                      />
                    </span>
                    {/* Follow button next to username */}
                    <button
                      onClick={toggleFollow}
                      style={{ padding: `${getResponsiveSize(4)} ${getResponsiveSize(10)}`, fontSize: getResponsiveSize(12), marginLeft: 8 }}
                      className={`font-medium rounded-full hover:opacity-80 transition-all duration-300 flex items-center gap-1 ${isFollowing ? 'bg-white/20 text-white border border-white/30' : 'bg-[#29ABE2] text-white'}`}
                    >
                      {isFollowing ? 'Followed' : 'Follow'}
                    </button>
                  </h3>
                </div>
              </Link>
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
          
          {/* Seek Bar - Improved for better touch/click handling */}
          <div 
            ref={seekbarRef}
            className="mt-2 h-1 bg-black/30 rounded-full cursor-pointer select-none group"
            data-seekbar="true"
            onMouseDown={handleSeekbarDragStart}
            onTouchStart={handleSeekbarDragStart}
            onClick={(e) => {
              // Prevent triggering video play/pause
              e.stopPropagation();
              
              if (!videoRef.current) return;
              
              // Calculate seek position directly
              const rect = e.currentTarget.getBoundingClientRect();
              const seekPos = (e.clientX - rect.left) / rect.width;
              const newTime = Math.max(0, Math.min(1, seekPos)) * videoRef.current.duration;
              
              // Set video time directly without affecting playback
              videoRef.current.currentTime = newTime;
            }}
          >
            <div 
              className="h-full bg-[#29ABE2]/50 rounded-full relative transition-all duration-300 ease-out select-none group-hover:bg-[#29ABE2]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
              data-seekbar="true"
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#29ABE2]/50 shadow-md transition-all duration-300 ease-out transform group-hover:bg-[#29ABE2] group-hover:scale-125 select-none" 
                data-seekbar="true"
              />
            </div>
          </div>
        </div>

        {/* Engagement Buttons */}
        <div
          style={{
            gap: getResponsiveSize(16),
            right: '1rem',
            top: getResponsiveSize(450),
            position: 'absolute',
            transform: 'translateY(-50%)',
          }}
          className="flex flex-col"
        >
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              style={{ width: getResponsiveSize(38), height: getResponsiveSize(38) }}
              className={`flex items-center justify-center rounded-full ${
                isLiked ? 'text-[#29ABE2]' : 'text-white'
              }`}
            >
              <div style={{ width: getResponsiveSize(28), height: getResponsiveSize(28) }}>
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
              style={{ width: getResponsiveSize(38), height: getResponsiveSize(38) }}
              className="flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
            >
              <div style={{ width: getResponsiveSize(28), height: getResponsiveSize(28) }}>
                <Image 
                  src="/assets/Vector-12.png"
                  alt="Comments"
                  width={28}
                  height={28}
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
              style={{ width: getResponsiveSize(38), height: getResponsiveSize(38) }}
              className="flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
            >
              <div style={{ width: getResponsiveSize(28), height: getResponsiveSize(28) }}>
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

export default function VideoFeed2({ creatorHandle, onClose, initialVideoIndex = 0 }: VideoFeed2Props) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(initialVideoIndex);
  const [hasOpenComments, setHasOpenComments] = useState(false);
  const [hasOpenArticle, setHasOpenArticle] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoComments, setVideoComments] = useState<{ [key: string]: Comment[] }>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeekbarDragging, setIsSeekbarDragging] = useState(false);
    
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Determine current category based on pathname
  const currentCategory = pathname === '/' || pathname === '/foryou' ? 'For You' : 
    pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  // Add function to fetch comments
  const fetchComments = async (videoId: string) => {
    try {
      setIsLoadingComments(true);
      const response = await axios.get('http://localhost:5000/api/engagement/comments', {
        params: {
          contentId: videoId,
          contentType: 'Video',
          limit: 10
        }
      });

      if (response.data && response.data.comments) {
        setVideoComments(prev => ({
          ...prev,
          [videoId]: response.data.comments.map((comment: any) => ({
            _id: comment._id,
            user: {
              name: comment.user.name,
              profilePicture: comment.user.profilePicture || '/default-avatar.png'
            },
            text: comment.text,
            likes: comment.likes || 0,
            createdAt: new Date(comment.createdAt).toLocaleString(),
            repliesCount: comment.repliesCount || 0,
            timestamp: comment.timestamp
          }))
        }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Add effect to fetch comments when a video becomes active
  useEffect(() => {
    if (videos[activeVideoIndex] && hasOpenComments) {
      fetchComments(videos[activeVideoIndex].id);
    }
  }, [activeVideoIndex, hasOpenComments]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let response;
        if (creatorHandle) {
          // Remove @ symbol if present and convert to lowercase
          const handle = creatorHandle.replace('@', '').toLowerCase();
          
          // First fetch the creator's profile by handle
          const profileResponse = await axios.get(`http://localhost:5000/api/profile/handle/${handle}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!profileResponse.data?.data?.profile) {
            throw new Error('Creator profile not found');
          }

          const creatorId = profileResponse.data.data.profile._id;
          
          // Then fetch videos using the creator's MongoDB ID
          response = await axios.get(`http://localhost:5000/api/videos/creator/${creatorId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        } else {
          response = await axios.get('http://localhost:5000/api/videos/feed', {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }

        if (response.data && Array.isArray(response.data.videos)) {
          const videosWithUrls = response.data.videos.map((video: any) => ({
            id: video._id,
            videoFile: `http://localhost:5000/api/videos/${video._id}/stream`,
            thumbnail: video.thumbnail ? `http://localhost:5000/uploads/thumbnails/${video.thumbnail}` : '/default-thumbnail.png',
            title: video.title || 'Untitled Video',
            description: video.description || 'No description available',
            likes: video.likes || 0,
            comments: video.comments || 0,
            creator: {
              name: video.creator?.name || 'Anonymous',
              avatar: video.creator?.profilePicture
            },
            headline: video.headline
          }));
          setVideos(videosWithUrls);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err: any) {
        let errorMessage = creatorHandle 
          ? `Failed to fetch videos for creator ${creatorHandle}`
          : 'Failed to fetch videos';
        
        if (err.response) {
          errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Could not connect to server. Please check if the server is running.';
        } else {
          errorMessage = err.message || 'An unexpected error occurred';
        }
        setError(errorMessage);
        console.error('Error fetching videos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [creatorHandle]); // Add creatorHandle as dependency to refetch when it changes

  // Handle back button click
  const handleBackClick = () => {
    if (onClose) {
      // Store the current video index before closing
      localStorage.setItem('lastVideoIndex', activeVideoIndex.toString());
      onClose();
    } else if (creatorHandle) {
      // Navigate back to the creator page
      router.push(`/@${creatorHandle}`);
    } else {
      // Otherwise, use the default back behavior
      router.back();
    }
  };

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
          videoElement.scrollIntoView({ behavior: 'auto' });
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

  // Ensure video restarts and autoplays on swipe (activeVideoIndex change)
  useEffect(() => {
    if (!videos[activeVideoIndex]) return;
    // Find the video element for the active video
    const videoElement = document.querySelector(`#video-${videos[activeVideoIndex].id} video`) as HTMLVideoElement;
    if (!videoElement) return;
    // Restart video and autoplay
    videoElement.currentTime = 0;
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {}); // Ignore errors for autoplay
    }
  }, [activeVideoIndex, videos]);

  // --- SWIPE TO SCROLL STATE & REFS (ultra-reliable, kawaii!) ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const dragStartTime = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 60; // px
  // --- Refs for always-fresh state in native handler ---
  const activeVideoIndexRef = useRef(activeVideoIndex);
  const videosLengthRef = useRef(videos.length);
  const swipeLockedRef = useRef(swipeLocked);
  useEffect(() => { activeVideoIndexRef.current = activeVideoIndex; }, [activeVideoIndex]);
  useEffect(() => { videosLengthRef.current = videos.length; }, [videos.length]);
  useEffect(() => { swipeLockedRef.current = swipeLocked; }, [swipeLocked]);

  // --- TOUCH HANDLERS (vertical swipe only, kawaii!) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('[SWIPE DEBUG] TouchStart');
    if (hasOpenComments || hasOpenArticle) return;
    setIsDragging(true);
    setSwipeLocked(false);
    setDragStartY(e.touches[0].clientY);
    setDragDeltaY(0);
    dragStartTime.current = Date.now();
  };
  const handleTouchEnd = () => {
    console.log('[SWIPE DEBUG] TouchEnd');
    setIsDragging(false);
    setDragStartY(null);
    setDragDeltaY(0);
    setSwipeLocked(false);
    dragStartTime.current = null;
  };
  // --- NATIVE TOUCH MOVE EFFECT (for buttery mobile swipes!) ---
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const handleNativeTouchMove = (e: TouchEvent) => {
      if (isDragging && !swipeLockedRef.current) {
        e.preventDefault();
        console.log('[SWIPE DEBUG] NativeTouchMove', e.touches[0]?.clientY);
        const touch = e.touches[0];
        if (!touch) return;
        const currentY = touch.clientY;
        if (dragStartY === null) return;
        const deltaY = currentY - dragStartY;
        setDragDeltaY(deltaY);
        if (Math.abs(deltaY) > SWIPE_THRESHOLD && !swipeLockedRef.current) {
          swipeLockedRef.current = true;
          setSwipeLocked(true);
          const direction = deltaY > 0 ? -1 : 1;
          let newIndex = activeVideoIndexRef.current + direction;
          newIndex = Math.max(0, Math.min(videosLengthRef.current - 1, newIndex));
          console.log('[SWIPE DEBUG] Swiping to video', newIndex);
          if (newIndex !== activeVideoIndexRef.current) {
            setActiveVideoIndex(newIndex);
            setTimeout(() => {
              document.getElementById(`video-${videos[newIndex]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }
        }
      }
    };
    feed.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => {
      feed.removeEventListener('touchmove', handleNativeTouchMove);
    };
  }, [isDragging, dragStartY, videos]);

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
    <div className="h-screen flex flex-col">
      {/* Back Button - Only visible when ArticlePopup is closed */}
      {!hasOpenArticle && (
        <div className="absolute top-4 left-4 z-[100] transition-opacity duration-300">
          <button
            onClick={handleBackClick}
            style={{
              padding: `${getResponsiveSize(6)} ${getResponsiveSize(12)}`,
              gap: getResponsiveSize(4)
            }}
            className="flex items-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-300 group"
          >
            <ArrowLeft 
              style={{ 
                width: getResponsiveSize(18),
                height: getResponsiveSize(18)
              }} 
              className="text-white group-hover:scale-110 transition-transform" 
            />
            <span style={{ fontSize: getResponsiveSize(12) }} className="font-medium">Back</span>
          </button>
        </div>
      )}
      {/* Video Feed */}
      <div 
        ref={feedRef}
        className="w-full flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative h-screen"
        style={{
          minHeight: '100vh',
          cursor: isDragging ? 'grabbing' : 'default',
          pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto',
          touchAction: isDragging ? 'none' : 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
              className={`relative w-full h-full snap-start ${index === currentVideoIndex ? 'z-10' : 'z-0'}`}
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
      <div className="w-full mx-auto z-50">
        <BottomNav />
      </div>
      {/* Comments Component */}
      {videos[activeVideoIndex] && (
        <Comments 
          isOpen={hasOpenComments}
          onClose={() => setHasOpenComments(false)}
          comments={videoComments[videos[activeVideoIndex].id] || []}
          isLoading={isLoadingComments}
        />
      )}
      {/* Article Popup */}
      {videos[activeVideoIndex] && (
        <ArticlePopup 
          isOpen={hasOpenArticle}
          onClose={() => setHasOpenArticle(false)}
          title={videos[activeVideoIndex].title}
          content={videos[activeVideoIndex].description}
        />
      )}
    </div>
  );
} 