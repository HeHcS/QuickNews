'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import CommentSection from './CommentSection';

interface Video {
  id: string;
  url: string;
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
}

const sampleComments: { [key: string]: Array<{
  id: string;
  user: { name: string; avatar: string };
  text: string;
  likes: number;
  timestamp: string;
}> } = {
  '1': [
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
    },
    {
      id: '3',
      user: {
        name: 'Emma Watson',
        avatar: 'https://picsum.photos/seed/emma/100/100',
      },
      text: '0:45 is literally the best part! Had to watch it multiple times 😍',
      likes: 567,
      timestamp: '45m ago',
    },
    {
      id: '4',
      user: {
        name: 'David Kim',
        avatar: 'https://picsum.photos/seed/david/100/100',
      },
      text: 'Been following your work for months, and you keep getting better! Any tips for aspiring creators?',
      likes: 231,
      timestamp: '20m ago',
    },
    {
      id: '5',
      user: {
        name: 'Sarah Johnson',
        avatar: 'https://picsum.photos/seed/sarah/100/100',
      },
      text: '🎵 Does anyone know the background music? It\'s so good!',
      likes: 142,
      timestamp: '5m ago',
    }
  ],
  '2': [
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
    },
    {
      id: '3',
      user: {
        name: 'James Wilson',
        avatar: 'https://picsum.photos/seed/james/100/100',
      },
      text: 'This gives me such nostalgic vibes 🌟 Reminds me of old school cinematography but with a modern twist',
      likes: 189,
      timestamp: '30m ago',
    }
  ],
  // Add more comments for other videos...
};

const generateVideoContent = (url: string) => {
  const filename = url.split('/').pop()?.replace('.mp4', '') || '';
  
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

function VideoPost({ video, isActive }: VideoPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCaptionsExpanded, setIsCaptionsExpanded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.7,
  });

  // Generate content based on video URL
  const videoContent = generateVideoContent(video.url);

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

  const togglePlay = () => {
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
    <div ref={ref} className="relative h-[700px] w-full snap-start bg-black">
      {/* Video Layer */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={togglePlay}
      >
      <video
        ref={videoRef}
        src={video.url}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
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
                  onClick={() => setIsCaptionsExpanded(!isCaptionsExpanded)}
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
              <button className="pointer-events-auto px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors">
                Subscribe
              </button>
            </div>
            <button className="pointer-events-auto px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors">
              Full Article
            </button>
          </div>
      </div>

      {/* Interaction Buttons */}
        <div className="absolute right-2 bottom-[160px] flex flex-col items-center space-y-4">
        <button 
            className="group flex flex-col items-center pointer-events-auto"
          onClick={() => setIsLiked(!isLiked)}
        >
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white mb-1">
              <span className="text-2xl">{isLiked ? '💙' : '🤍'}</span>
          </div>
            <span className="text-white text-xs font-medium">{video.likes + (isLiked ? 1 : 0)}</span>
        </button>
          <button 
            className="group flex flex-col items-center pointer-events-auto"
            onClick={() => setIsCommentsOpen(true)}
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white mb-1">
              <span className="text-2xl">💬</span>
          </div>
            <span className="text-white text-xs font-medium">{video.comments}</span>
        </button>
          <button className="group flex flex-col items-center pointer-events-auto">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white mb-1">
              <span className="text-2xl">⏩</span>
          </div>
            <span className="text-white text-xs font-medium">Share</span>
        </button>
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

      {/* Comments Section */}
      <CommentSection
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={sampleComments[video.id] || []}
      />
    </div>
  );
}

const sampleVideos: { [key: string]: Video[] } = {
  Breaking: [
    {
      id: '1',
      url: '/VidAssets/bbcnewsvideo1.mp4',
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
      id: '2',
      url: '/VidAssets/dylanpagevideo1.mp4',
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
    id: '1',
      url: '/VidAssets/dailymailvideo1.mp4',
      title: 'Daily Mail Latest 📰',
    creator: {
        name: 'Daily Mail',
        avatar: 'https://picsum.photos/seed/dailymail1/100/100',
    },
    likes: 1234,
      comments: 89
  },
  {
    id: '2',
      url: '/VidAssets/dylanpagevideo2.mp4',
      title: 'Dylan Page Latest 🎬',
    creator: {
        name: 'Dylan Page',
        avatar: 'https://picsum.photos/seed/dylan2/100/100',
    },
    likes: 2345,
      comments: 156
  },
  {
    id: '3',
      url: '/VidAssets/dailymailvideo2.mp4',
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
      id: '3',
      url: '/VidAssets/bbcnewsvideo1.mp4',
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
    id: '4',
      url: '/VidAssets/dylanpagevideo1.mp4',
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
    id: '5',
      url: '/VidAssets/dailymailvideo2.mp4',
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

export default function VideoFeed() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  
  // Define categories in the same order as TopNav
  const categories = ['Breaking', 'Politics', 'For You', 'Tech', 'Business', 'Following'];
  
  // Determine current category based on pathname
  const currentCategory = pathname === '/' ? 'For You' : 
    pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  const videos = sampleVideos[currentCategory] || sampleVideos['For You'];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const newIndex = Math.round(element.scrollTop / element.clientHeight);
    setActiveVideoIndex(newIndex);
  };

  const handleCategoryChange = (newIndex: number) => {
    const currentIndex = categories.indexOf(currentCategory);
    
    if (newIndex !== currentIndex) {
      const newCategory = categories[newIndex];
      const newPath = newCategory === 'For You' ? '/' : `/${newCategory.toLowerCase()}`;
      router.push(newPath);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    setDragOffset(currentX - (touchStart || 0));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

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
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    setDragOffset(currentX - (touchStart || 0));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

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
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {videos.map((video, index) => (
          <VideoPost
            key={video.id}
            video={video}
            isActive={index === activeVideoIndex}
          />
        ))}
      </div>

      {/* Ensure BottomNav stays on top */}
      <div className="relative z-30">
      <BottomNav />
      </div>
    </div>
  );
} 