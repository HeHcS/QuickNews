'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import Comments from './Comments';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ArticlePopup from './ArticlePopup';
import Link from 'next/link';
import { Heart, Share2, Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, MessageCircle, NewspaperIcon, XIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

// Add CSS for double tap heart animation
const doubleTapHeartStyle = `
  @keyframes double-tap-heart {
    0% {
      transform: scale(0) translateY(0);
      opacity: 0;
    }
    15% {
      transform: scale(1.2) translateY(0);
      opacity: 1;
    }
    30% {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
    100% {
      transform: scale(1.5) translateY(-50px);
      opacity: 0;
    }
  }
  
  .animate-double-tap-heart {
    animation: double-tap-heart 1.2s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
    animation-delay: var(--animation-delay, 0s);
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
  article?: {
    title: string;
    content: string;
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

interface VideoFeed2Props {
  videos: Video[];
  creatorHandle?: string;
  onClose?: () => void;
}

// Helper function to calculate responsive sizes
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
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

// Add this at the top of the file, after imports
const currentlyPlayingVideoRef = { current: null as HTMLVideoElement | null };

function VideoPost({ video, isActive, isCommentsOpen, onCommentsOpenChange, isArticleOpen, onArticleOpenChange }: VideoPostProps) {
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
        togglePlay(e);
      }
    }, 400);
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
            // Add a smooth fade-out animation for the pause icon
            setIsPlayPauseFading(true);
            setTimeout(() => {
              setShowPlayPause(false);
              setIsPlayPauseFading(false);
            }, 300); // Match this with CSS transition duration
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      // Pause the video immediately
      video.pause();
      setIsPlaying(false);
      
      // Show pause button when paused
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

  // Update isPlaying state based on video's actual playing state
  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !seekbarRef.current) return;
    
    const videoElement = videoRef.current;
    const seekBar = seekbarRef.current;
    const rect = seekBar.getBoundingClientRect();
    const seekPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Set the video time based on the seek position
    videoElement.currentTime = seekPosition * videoElement.duration;
  };

  // Handle seekbar drag start
  const handleSeekbarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!videoRef.current || !seekbarRef.current) return;
    
    setIsSeekbarDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    dragStartTime.current = videoRef.current.currentTime;
    
    e.stopPropagation(); // Prevent other event handlers from firing
  };

  // Handle seekbar drag
  const handleSeekbarDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSeekbarDragging || !videoRef.current || !seekbarRef.current) return;
    
    const videoElement = videoRef.current;
    const seekBar = seekbarRef.current;
    const rect = seekBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    // Calculate the drag distance and convert to time
    const dragDistance = clientX - dragStartX.current;
    const seekBarWidth = rect.width;
    const timeChange = (dragDistance / seekBarWidth) * videoElement.duration;
    
    // Set the new time, ensuring it stays within bounds
    const newTime = Math.max(0, Math.min(videoElement.duration, dragStartTime.current + timeChange));
    videoElement.currentTime = newTime;
    
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
        <div 
          style={{ 
            bottom: getResponsiveSize(110),
            opacity: captionsOpacity,
            transform: isCaptionsClosing ? `translateY(${getResponsiveSize(20)})` : 'translateY(0)',
            transition: 'opacity 300ms ease-out, transform 300ms ease-out'
          }} 
          className="absolute left-0 right-[10px] p-4 text-white"
        >
          <h2 style={{ fontSize: getResponsiveSize(20) }} className="font-bold mb-0 select-none mt-[2%] max-w-[75%]">{videoContent.title}</h2>
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
              }} className="select-none max-w-[85%] text-gray-300">{videoContent.text}</p>
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

        <div style={{ bottom: getResponsiveSize(70) }} className="absolute left-0 right-0 p-2.5 text-white">
          <div className="flex items-center justify-between interactive-element">
            <div className="flex items-center gap-2">
              <Link
                href={`/@${video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
                className="hover:opacity-90 transition-opacity z-30"
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem('lastVideoId', video.id);
                }}
              >
                <img
                  src={video.creator.avatar || '/default-avatar.png'}
                  alt={video.creator.name}
                  style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}
                  className="rounded-full border border-white/20 select-none"
                />
              </Link>
              <Link
                href={`/@${video.creator.name.toLowerCase().replace(/\s+/g, '')}`}
                className="hover:opacity-90 transition-opacity z-30 block"
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem('lastVideoId', video.id);
                }}
              >
                <div>
                  <h3 style={{ fontSize: getResponsiveSize(14) }} className="font-semibold leading-tight hover:text-[#29ABE2] transition-colors flex items-center gap-1 select-none">
                    {video.creator.name}
                    <span className="text-[#29ABE2]">
                      <svg style={{ width: getResponsiveSize(12), height: getResponsiveSize(12) }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </h3>
                  <h4 style={{ fontSize: getResponsiveSize(11) }} className="text-white/70 leading-tight hover:text-[#29ABE2] transition-colors select-none">@{video.creator.name.toLowerCase().replace(/\s+/g, '')}</h4>
                </div>
              </Link>
              <button
                onClick={toggleFollow}
                style={{ 
                  padding: `${getResponsiveSize(4)} ${getResponsiveSize(10)}`,
                  fontSize: getResponsiveSize(12)
                }}
                className={`pointer-events-auto font-medium rounded-full hover:opacity-80 transition-all duration-300 flex items-center gap-1 relative ${getAnimationClasses()}`}
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
              className="pointer-events-auto bg-[#29ABE2] text-white font-medium rounded-full hover:bg-[#29ABE2]/80 transition-colors"
            >
              Full Article
            </button>
          </div>
          
          {/* Seek Bar - Moved here */}
          <div 
            ref={seekbarRef}
            className="mt-2 h-1 bg-black/30 rounded-full cursor-pointer select-none group"
            onClick={handleSeek}
            onMouseDown={handleSeekbarDragStart}
            onTouchStart={handleSeekbarDragStart}
          >
            <div 
              className="h-full bg-[#29ABE2]/50 rounded-full relative transition-all duration-300 ease-out select-none group-hover:bg-[#29ABE2]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#29ABE2]/50 shadow-md transition-all duration-300 ease-out transform group-hover:bg-[#29ABE2] group-hover:scale-125 select-none" />
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
            zIndex: 30,
            pointerEvents: 'auto',
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

export default function VideoFeed2({ videos: initialVideos, creatorHandle, onClose }: VideoFeed2Props) {
  const [videos, setVideos] = useState(initialVideos);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Add this effect to handle article data
  useEffect(() => {
    // If the active video has no article data, generate some sample data
    if (videos[activeVideoIndex] && !videos[activeVideoIndex].article) {
      const videoContent = generateVideoContent(videos[activeVideoIndex].videoFile);
      
      // Create a deep copy of the videos array
      const updatedVideos = [...videos];
      
      // Add article data to the active video
      updatedVideos[activeVideoIndex] = {
        ...updatedVideos[activeVideoIndex],
        article: {
          title: videoContent.title,
          content: videoContent.text + "\n\n" + 
                  "This is a sample article generated for demonstration purposes. " +
                  "In a real application, this would be fetched from a database or API."
        }
      };
      
      // Update the videos array in state
      setVideos(updatedVideos);
      console.log("Generated article data for video:", updatedVideos[activeVideoIndex].id);
    }
  }, [activeVideoIndex, videos]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isCommentsOpen || isArticleOpen) return;
    
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
  };

  // Handle back button click
  const handleBackClick = () => {
    if (onClose) {
      // If we have an onClose handler, use it to close the popup
      onClose();
    } else if (creatorHandle) {
      // Navigate back to the creator page
      router.push(`/@${creatorHandle}`);
    } else {
      // Otherwise, use the default back behavior
      router.back();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      onScroll={handleScroll}
    >
      {/* Back Button - Only visible when ArticlePopup is closed */}
      {!isArticleOpen && (
        <div className="absolute top-4 left-4 z-[100] transition-opacity duration-300">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-300 group px-4 py-2"
          >
            <ArrowLeft size={24} className="text-white group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Back</span>
          </button>
        </div>
      )}
      
      {videos.length === 0 ? (
        <div className="h-full flex items-center justify-center bg-black text-white text-center p-4">
          <p>No videos available</p>
        </div>
      ) : (
        videos.map((video, index) => (
          <div
            key={video.id}
            className="relative w-full h-full snap-start"
          >
            <VideoPost
              video={video}
              isActive={index === activeVideoIndex}
              isCommentsOpen={isCommentsOpen}
              onCommentsOpenChange={setIsCommentsOpen}
              isArticleOpen={isArticleOpen}
              onArticleOpenChange={setIsArticleOpen}
            />
          </div>
        ))
      )}

      {/* Comments Component */}
      {videos[activeVideoIndex] && (
        <Comments 
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          comments={[]}
        />
      )}

      {/* Article Popup */}
      {videos[activeVideoIndex] && videos[activeVideoIndex].article && (
        <ArticlePopup 
          isOpen={isArticleOpen}
          onClose={() => setIsArticleOpen(false)}
          title={videos[activeVideoIndex].article?.title || ''}
          content={videos[activeVideoIndex].article?.content || ''}
        />
      )}

      {/* Bottom Navigation */}
      <div style={{ pointerEvents: isCommentsOpen || isArticleOpen ? 'none' : 'auto' }}>
        <BottomNav />
      </div>
    </div>
  );
} 