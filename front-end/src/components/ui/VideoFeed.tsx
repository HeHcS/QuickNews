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
    handle?: string;
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

interface VideoFeedProps {
  page?: number;
  limit?: number;
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
const wasSeekbarDragRef = { current: false };
const isSeekbarDraggingRef = { current: false };

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
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = doubleTapHeartStyle;
  document.head.appendChild(styleElement);
}

// 1. Add a custom filled, translucent pause icon component at the top (after imports)
const FilledPause = ({ size = 20, style = {} }) => { // Responsive base size
  const px = parseInt(getResponsiveSize(size));
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="white"
      fillOpacity="0.6" // Translucent
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }}
    >
      <rect x="7" y="6" width="6" height="20" rx="2" />
      <rect x="19" y="6" width="6" height="20" rx="2" />
    </svg>
  );
};

// 2. Add a custom filled, translucent play icon component at the top (after FilledPause)
const FilledPlay = ({ size = 20, style = {} }) => { // Responsive base size
  const px = parseInt(getResponsiveSize(size));
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="white"
      fillOpacity="0.6" // Translucent
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

  // Double tap heart animation state
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState({ x: 0, y: 0 });

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
    // Reset double tap heart state when video changes or becomes inactive
    setShowDoubleTapHeart(false);
    setDoubleTapPosition({ x: 0, y: 0 });
    // Reset play/pause icon state when video becomes active again
    setShowPlayPause(false);
    setIsPlayPauseFading(false);
  }, [video.id, isActive]);

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
      videoElement.muted = true; // Temporarily mute to improve autoplay chances
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            videoElement.muted = false; // Unmute after successful play
          })
          .catch((error) => {
            console.error("Autoplay failed:", error);
            // Try again with muted playback as fallback
            videoElement.muted = true;
            videoElement.play().catch(e => console.error("Muted autoplay also failed:", e));
            setIsPlaying(false);
          });
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
      
      // Force autoplay on mount with muted fallback
      videoElement.muted = true;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Unmute after successful autoplay
            videoElement.muted = false;
          })
          .catch((error) => {
            console.error("Initial autoplay failed:", error);
            // Keep it muted and try again
            videoElement.play().catch(e => console.error("Muted autoplay also failed:", e));
          });
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
        
        // Force autoplay on load with muted fallback
        videoElement.muted = true;
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              // Unmute after successful autoplay
              videoElement.muted = false;
            })
            .catch((error) => {
              console.error("Loaded data autoplay failed:", error);
              // Keep it muted and try again
              videoElement.play().catch(e => console.error("Muted autoplay also failed:", e));
            });
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
    if (isSeekbarDragging || isSeekbarDraggingRef.current) return;
    if (wasSeekbarDragRef.current) { wasSeekbarDragRef.current = false; return; }
    const isSeekbarZone = e.target instanceof Element && (
      e.target.closest('[data-seekbar-zone="true"]') !== null
    );
    if (isSeekbarZone) return;
    e.stopPropagation();
    e.preventDefault();
    // Calculate tap position relative to the container
    const rect = containerRef.current?.getBoundingClientRect();
    const tapPosition = {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0)
    };
    const now = Date.now();
    if (now - lastTapTimeRef.current < 400) {
      tapCountRef.current = 0;
      isDoubleTapRef.current = true;
      // Show heart animation at tap position with delay and layout stability
      setDoubleTapPosition(tapPosition);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setShowDoubleTapHeart(true);
        }, 80); // Small delay for kawaii pop effect
      });
      // Only like the video if it's not already liked
      if (!isLiked) {
        setIsLiked(true);
      }
      // Hide heart animation after 1 second + delay
      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1080); // 1000ms + 80ms delay
      lastTapTimeRef.current = 0;
      return;
    }
    lastTapTimeRef.current = now;
    tapCountRef.current = 1;
    if (playPauseTimeoutRef.current) {
      clearTimeout(playPauseTimeoutRef.current);
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    setTimeout(() => {
      if (tapCountRef.current === 1) {
        if (!wasSeekbarDragRef.current && !isSeekbarDraggingRef.current) togglePlay(e);
        wasSeekbarDragRef.current = false;
      }
    }, 400);
  };

  const togglePlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wasSeekbarDragRef.current || isSeekbarDraggingRef.current) { wasSeekbarDragRef.current = false; return; }
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
    e.stopPropagation();
    e.preventDefault();
    setIsSeekbarDragging(true);
    isSeekbarDraggingRef.current = true;
    wasSeekbarDragRef.current = true;
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
    setIsSeekbarDragging(false);
    // Keep play/pause disabled for 1 second after drag ends
    setTimeout(() => {
      isSeekbarDraggingRef.current = false;
    }, 1000);
    wasSeekbarDragRef.current = false;
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

  // Update video elements attributes
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
            muted={false}
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
        <div className="absolute inset-0 z-[9999] pointer-events-none">
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
          <h2 style={{ fontSize: getResponsiveSize(20) }} className="font-bold mb-0 select-none mt-[2%] max-w-[75%]">
            {video.title}
            {/* Badge appears after the title text, even if it wraps to the next line */}
            <span style={{ marginLeft: 8, verticalAlign: 'middle', marginTop: -11, display: 'inline-block' }}>
              <img
                src="/assets/QuickNewsverifiedbadge.png"
                alt="QuickNews Verified Badge"
                style={{ width: getResponsiveSize(90), height: getResponsiveSize(18), display: 'inline-block' }}
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
                href={`/@${video.creator.handle || video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
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
                href={`/@${video.creator.handle || video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
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
          
          {/* Seek Bar - Moved here */}
          <div 
            data-seekbar-zone="true"
            style={{ position: 'relative', width: '100%' }}
          >
            {/* Blocker zone to prevent play/pause interaction on seekbar uwu! */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '0',
                width: '100%',
                height: getResponsiveSize(16), // match seekbar + a little extra for touch
                zIndex: 20,
                background: 'transparent',
                pointerEvents: 'auto',
              }}
              onClick={e => { e.stopPropagation(); e.preventDefault(); }}
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
              onMouseUp={e => { e.stopPropagation(); e.preventDefault(); }}
              onTouchStart={e => { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); }}
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
              onPointerUp={e => { e.stopPropagation(); e.preventDefault(); }}
            />
            <div 
              ref={seekbarRef}
              className="mt-2 h-1 bg-black/30 rounded-full cursor-pointer select-none group"
              data-seekbar="true"
              style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}
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
  const [videoComments, setVideoComments] = useState<{ [key: string]: Comment[] }>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeekbarDragging, setIsSeekbarDragging] = useState(false);
  // Infinite scroll state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const VIDEOS_THRESHOLD = 3; // Load more when user is within 3 videos of the end
    
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekbarRef = useRef<HTMLDivElement>(null);
  
  // Use category names from our configuration
  const categories = APP_CATEGORIES.map(cat => cat.name);
  
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

  // Modified fetchVideos function to support pagination
  const fetchVideos = async (page = 1, append = false) => {
      try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
        setError(null);
        
        // Send category parameter if not "For You"
      const params: any = currentCategory === 'For You' ? {} : { category: currentCategory };
      
      // Add pagination parameters
      params.page = page;
      params.limit = 10; // Number of videos per page
        
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

      // Check if response has the videos array and pagination info
        if (response.data && Array.isArray(response.data.videos)) {
          // Map the response to include full video URLs and format the data
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
              handle: video.creator?.handle || video.creator?.name?.toLowerCase().replace(/\s+/g, '') || 'anonymous',
              avatar: video.creator?.profilePicture
            },
            headline: video.headline
          }));
        
        // Update state based on whether we're appending or replacing
        if (append) {
          setVideos(prevVideos => [...prevVideos, ...videosWithUrls]);
        } else {
          setVideos(videosWithUrls);
        }
        
        // Update pagination information
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.page);
          setTotalPages(response.data.pagination.pages);
          setHasMoreVideos(response.data.pagination.page < response.data.pagination.pages);
        }
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
      if (page === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      }
    };

  // Function to load more videos when user approaches the end of the feed
  const loadMoreVideos = () => {
    if (isLoadingMore || !hasMoreVideos) return;
    
    console.log('Loading more videos, current page:', currentPage);
    fetchVideos(currentPage + 1, true);
  };

  // Initial load of videos
  useEffect(() => {
    setCurrentPage(1);
    fetchVideos(1, false);
  }, [currentCategory]);

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
        setActiveVideoIndex(videoIndex);
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

  const isProgrammaticScroll = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasOpenComments || hasOpenArticle) return;
    if (isProgrammaticScroll.current) return;
    
    const element = e.currentTarget;
    const newIndex = Math.round(element.scrollTop / element.clientHeight);
    
    // Check if we're approaching the end of the loaded videos
    if (hasMoreVideos && !isLoadingMore && newIndex >= videos.length - VIDEOS_THRESHOLD) {
      loadMoreVideos();
    }
    
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
          
          // Improved autoplay with muted fallback
          videoElement.muted = true; // Temporarily mute to improve autoplay chances
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                videoElement.muted = false; // Unmute after successful play
              })
              .catch((error) => {
                console.error("Scroll autoplay failed:", error);
                // Try again with muted playback as fallback
                videoElement.muted = true;
                videoElement.play().catch(e => console.error("Muted autoplay also failed:", e));
              });
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

  // --- Touch event helpers for swipe-to-scroll kawaii! ---
  // Helper to scroll to a video by index
  const scrollToVideo = (index: number) => {
    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.scrollTo({
        top: feedElement.clientHeight * index,
        behavior: 'smooth',
      });
    }
  };

  // Replace handleTouchStart, handleTouchMove, handleTouchEnd with kawaii swipe logic!
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY2, setTouchStartY2] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const swipeHandledRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('[DEBUG] handleTouchStart fired', e.touches[0].clientX, e.touches[0].clientY);
    if (hasOpenComments || hasOpenArticle) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY2(e.touches[0].clientY);
    setIsDragging(true);
    setIsScrolling(false);
    setSwipeDirection('none');
    swipeHandledRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    console.log('[DEBUG] handleTouchMove fired', e.touches[0].clientX, e.touches[0].clientY);
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    if (swipeHandledRef.current) return; // Only allow one swipe per gesture
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    if (touchStartX === null || touchStartY2 === null) return;
    const dx = currentX - touchStartX;
    const dy = currentY - touchStartY2;
    // Determine swipe direction if not set
    if (swipeDirection === 'none') {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        setSwipeDirection('horizontal');
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        setSwipeDirection('vertical');
      }
    }
    // Horizontal swipe: category change (existing logic)
    if (swipeDirection === 'horizontal') {
      if (dragTimeout.current) clearTimeout(dragTimeout.current);
      dragTimeout.current = setTimeout(() => {
        setIsDragging(false);
        setDragOffset(0);
        setTouchStart(null);
        setTouchStartX(null);
        setTouchStartY2(null);
        touchStartY.current = null;
      }, 300);
      const maxOffsetHorizontal = window.innerWidth * 0.3;
      const newOffsetHorizontal = currentX - (touchStartX || 0);
      setDragOffset(Math.max(-maxOffsetHorizontal, Math.min(maxOffsetHorizontal, newOffsetHorizontal)));
    }
    // Vertical swipe: video scroll kawaii~
    if (swipeDirection === 'vertical') {
      e.preventDefault();
      const threshold = 50;
      if (Math.abs(dy) > threshold) {
        let newIndex = activeVideoIndex;
        if (dy > 0 && activeVideoIndex > 0) {
          newIndex = activeVideoIndex - 1;
        } else if (dy < 0 && activeVideoIndex < videos.length - 1) {
          newIndex = activeVideoIndex + 1;
        }
        if (newIndex !== activeVideoIndex) {
          swipeHandledRef.current = true;
          setActiveVideoIndex(newIndex);
          isProgrammaticScroll.current = true;
          setTimeout(() => {
            document.getElementById(`video-${newIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
          }, 0);
        }
        // Do NOT reset drag state here! Only do it on touchend.
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('[DEBUG] handleTouchEnd fired');
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchStartX(null);
    setTouchStartY2(null);
    touchStartY.current = null;
  };

  // Scroll to the correct video when activeVideoIndex changes
  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTo({
      top: feedRef.current.clientHeight * activeVideoIndex,
      behavior: 'smooth',
    });
  }, [activeVideoIndex]);

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

  // Add effect to handle returning to last video
  useEffect(() => {
    const lastVideoId = localStorage.getItem('lastVideoId');
    if (lastVideoId && videos.length > 0) {
      const videoIndex = videos.findIndex(v => v.id === lastVideoId);
      if (videoIndex !== -1) {
        setActiveVideoIndex(videoIndex);
        // Scroll to the video
        const feedElement = document.querySelector('.snap-mandatory');
        if (feedElement) {
          feedElement.scrollTo({
            top: feedElement.clientHeight * videoIndex,
            behavior: 'auto'
          });
        }
        // Clear the stored video ID
        localStorage.removeItem('lastVideoId');
      }
    }
  }, [videos]);

  // Restore mouse event handlers for mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasOpenComments || hasOpenArticle) return;
    setTouchStart(e.clientX);
    touchStartY.current = e.clientY;
    setIsDragging(true);
    setIsScrolling(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || hasOpenComments || hasOpenArticle) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    const verticalMovement = Math.abs(currentY - (touchStartY.current || 0));
    const horizontalMovement = Math.abs(currentX - (touchStart || 0));
    if (verticalMovement > horizontalMovement && !isScrolling) {
      setIsScrolling(true);
      setIsDragging(false);
      return;
    }
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }
    dragTimeout.current = setTimeout(() => {
      setIsDragging(false);
      setDragOffset(0);
      setTouchStart(null);
      touchStartY.current = null;
    }, 300);
    const maxOffsetMouse = window.innerWidth * 0.3;
    const newOffsetMouse = currentX - (touchStart || 0);
    setDragOffset(Math.max(-maxOffsetMouse, Math.min(maxOffsetMouse, newOffsetMouse)));
  };

  const handleMouseUp = () => {
    if (!isDragging || hasOpenComments || hasOpenArticle || isScrolling) {
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    touchStartY.current = null;
      return;
    }
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
    setTimeout(() => {
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    touchStartY.current = null;
    }, 50);
  };

  const handleMouseLeave = handleMouseUp;

  // Remove onTouchMove from the feed container's JSX and add a useEffect for native event
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    // Handler that mimics React's event signature
    const nativeTouchMove = (e: TouchEvent) => {
      // Wrap the React handler to use the same logic
      // @ts-ignore
      handleTouchMove(e);
    };
    feed.addEventListener('touchmove', nativeTouchMove, { passive: false });
    return () => {
      feed.removeEventListener('touchmove', nativeTouchMove);
    };
  }, [feedRef.current, isDragging, hasOpenComments, hasOpenArticle, touchStartX, touchStartY2, swipeDirection]);

  // Ensure video restarts and autoplays on swipe (activeVideoIndex change)
  useEffect(() => {
    if (!videos[activeVideoIndex]) return;
    // Find the video element for the active video
    const videoElement = document.querySelector(`#video-${videos[activeVideoIndex].id} video`) as HTMLVideoElement;
    if (!videoElement) return;
    
    // Restart video and autoplay with muted fallback
    videoElement.currentTime = 0;
    
    // If there's another video playing, pause it first
    if (currentlyPlayingVideoRef.current && currentlyPlayingVideoRef.current !== videoElement) {
      currentlyPlayingVideoRef.current.pause();
    }
    
    // Set this as the currently playing video
    currentlyPlayingVideoRef.current = videoElement;
    
    // Start muted to ensure autoplay works in most browsers
    videoElement.muted = true;
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Unmute after successful play
          videoElement.muted = false;
        })
        .catch((error) => {
          console.error("Active index change autoplay failed:", error);
          // Keep it muted and try again
          videoElement.play().catch(e => console.error("Muted autoplay also failed:", e));
        });
    }
  }, [activeVideoIndex, videos]);

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
            className="mt-4 px-4 py-2 bg-[#29ABE2] rounded-full hover:bg-[#29ABE2]/80 transition-colors"
            onClick={() => fetchVideos(1, false)}
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
    >
      <TopNav />
      {/* Video Feed */}
      <div 
        ref={feedRef}
        className="w-full h-[calc(100vh-120px)] mx-auto flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
        onScroll={handleScroll}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          cursor: isDragging ? 'grabbing' : 'default',
          pointerEvents: hasOpenComments || hasOpenArticle ? 'none' : 'auto',
          touchAction: isDragging ? 'none' : 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {videos.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-black text-white text-center p-4">
            <p>No videos available for this category</p>
          </div>
        ) : (
          <>
            {videos.map((video, index) => (
            <div
              key={video.id}
              id={`video-${video.id}`}
              className={`relative w-full h-full snap-start ${
                index === activeVideoIndex ? 'z-10' : 'z-0'
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
            ))}
            
            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="h-16 w-full flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
            
            {/* End of feed message when no more videos */}
            {!hasMoreVideos && videos.length > 0 && (
              <div className="h-16 w-full flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-sm opacity-70">You've reached the end of the feed</p>
                </div>
              </div>
            )}
          </>
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
          videoId={videos[activeVideoIndex].id}
          videoCreator={videos[activeVideoIndex].creator}
        />
      )}
    </div>
  );
} 