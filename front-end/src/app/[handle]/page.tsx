'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';
import { Menu, Play, UserSquare, Bookmark, ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import Comments from '@/components/ui/Comments';
import ArticlePopup from '@/components/ui/ArticlePopup';
import VideoFeed2 from '@/components/ui/VideoFeed2';

// Calculate responsive sizes based on viewport height (700px reference)
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

// Add global styles to hide scrollbar
const scrollbarHideStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  * {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

interface Post {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
}

// Sample videos data
const sampleVideos = [
  {
    id: '1',
    videoFile: '/VidAssets/bbcnewsvideo1.mp4',
    title: 'Breaking: Latest News Update 📰',
    creator: {
      name: 'BBC News',
      avatar: 'https://picsum.photos/seed/bbc1/100/100',
    },
    likes: 1234,
    comments: 89
  },
  {
    id: '2',
    videoFile: '/VidAssets/dailymailvideo1.mp4',
    title: 'Daily Mail Latest 📰',
    creator: {
      name: 'Daily Mail',
      avatar: 'https://picsum.photos/seed/dailymail1/100/100',
    },
    likes: 2345,
    comments: 156
  },
  {
    id: '3',
    videoFile: '/VidAssets/dylanpagevideo1.mp4',
    title: 'Dylan Page Latest 🎬',
    creator: {
      name: 'Dylan Page',
      avatar: 'https://picsum.photos/seed/dylan1/100/100',
    },
    likes: 3456,
    comments: 234
  },
  {
    id: '4',
    videoFile: '/VidAssets/dailymailvideo2.mp4',
    title: 'Daily Mail Update 📽️',
    creator: {
      name: 'Daily Mail',
      avatar: 'https://picsum.photos/seed/dailymail2/100/100',
    },
    likes: 4567,
    comments: 278
  },
  {
    id: '5',
    videoFile: '/VidAssets/dylanpagevideo2.mp4',
    title: 'Dylan Page Update 🎥',
    creator: {
      name: 'Dylan Page',
      avatar: 'https://picsum.photos/seed/dylan2/100/100',
    },
    likes: 5678,
    comments: 342
  },
  {
    id: '6',
    videoFile: '/VidAssets/bbcnewsvideo1.mp4',
    title: 'BBC News Update 📺',
    creator: {
      name: 'BBC News',
      avatar: 'https://picsum.photos/seed/bbc2/100/100',
    },
    likes: 6789,
    comments: 456
  }
];

// Sample comments data
const sampleComments = [
  {
    id: '1',
    user: {
      name: 'Alice Chen',
      avatar: 'https://picsum.photos/seed/alice/100/100',
    },
    text: 'This is amazing! The cinematography is on another level 🔥 Been waiting for content like this!',
    likes: 842,
    timestamp: '2h ago',
    replies: [
      {
        id: '1-reply-1',
        user: { name: 'Bob Smith', avatar: 'https://picsum.photos/seed/bob/100/100' },
        text: 'Totally agree! The lighting is perfect!',
        likes: 45,
        timestamp: '1h ago'
      }
    ]
  },
  {
    id: '2',
    user: {
      name: 'Michael Brown',
      avatar: 'https://picsum.photos/seed/michael/100/100',
    },
    text: 'First time seeing your content and I\'m already hooked! 🎬 Instant follow!',
    likes: 423,
    timestamp: '1h ago',
    replies: [
      {
        id: '2-reply-1',
        user: { name: 'Sophie Taylor', avatar: 'https://picsum.photos/seed/sophie/100/100' },
        text: 'Welcome to the community! You\'ll love it here!',
        likes: 32,
        timestamp: '45m ago'
      }
    ]
  }
];

// Sample article content
const sampleArticles = [
  {
    id: '1',
    title: 'Breaking: Major Climate Agreement Reached at Global Summit',
    content: `NATO leadership has issued a grave warning to its member states, calling for immediate preparation for potential "wartime scenarios". This extraordinary alert comes as a direct response to heightened international tensions and concerning rhetoric about World War III.

The alliance is intensifying its preparedness protocols, emphasizing the need for member nations to strengthen their defensive capabilities. This strategic shift reflects the organization's assessment of current global security risks and potential conflict scenarios.

Recent statements from Russia have contributed to the mounting tension, prompting NATO to take these unprecedented measures. The situation marks a critical point in international relations, with military readiness becoming increasingly paramount.`,
    source: 'BBC News',
    date: '12 November 2024'
  },
  {
    id: '2',
    title: 'Exclusive: Inside the Royal Family\'s New Initiative',
    content: `The Royal Family has launched a groundbreaking environmental campaign, setting new standards for sustainable living. This exclusive report takes you behind the scenes of their latest green initiative, showing how the monarchy is adapting to modern environmental challenges.

The initiative, which was announced last month, aims to reduce the carbon footprint of all royal residences by 50% within the next decade. This ambitious target has been met with both praise and skepticism from environmental experts.

Prince William and Princess Kate have been leading the charge, visiting various sustainable projects across the UK and meeting with environmental activists to discuss the best approaches to combating climate change.`,
    source: 'Daily Mail',
    date: '10 November 2024'
  },
  {
    id: '3',
    title: 'Behind the Scenes: A Day in Tech Valley',
    content: `Join me as I explore the latest innovations in Silicon Valley. From cutting-edge startups to tech giants, we're getting an exclusive look at what's shaping our digital future. The energy here is incredible, and the innovations we're seeing are going to change the way we live and work.

The first stop on our tour is a revolutionary AI company that's developing algorithms capable of predicting market trends with unprecedented accuracy. Their technology has already attracted billions in investment and is being used by major financial institutions worldwide.

Next, we visit a biotech startup that's working on gene-editing techniques that could potentially cure genetic diseases. The ethical implications are significant, but the potential benefits to humanity are enormous.`,
    source: 'Dylan Page',
    date: '8 November 2024'
  }
];

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const handle = (params?.handle as string)?.replace('@', '') || '';
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCaptionsExpanded, setIsCaptionsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Mock user data based on handle
  const userData = {
    name: handle.charAt(0).toUpperCase() + handle.slice(1),
    handle: handle,
    avatar: `https://picsum.photos/seed/${handle}/200/200`,
    bio: 'Feed your daily addiction with the biggest stories from news, politics, showbiz and everything else.',
    stats: {
      posts: 134,
      followers: '20.8m',
      following: 208
    }
  };

  const samplePosts = [
    {
      id: '1',
      title: 'Trump refuses to rule out communist as his trade war sparks despair',
      imageUrl: '/images/post1.jpg',
      description: 'Latest political developments...'
    },
    {
      id: '2',
      title: 'Music legend goes completely unnoticed as he travels by train to UK gig',
      imageUrl: '/images/post2.jpg',
      description: 'Entertainment news...'
    },
    {
      id: '3',
      title: 'Teacher who "joked" about having sex with pupil\'s mum is sacked',
      imageUrl: '/images/post3.jpg',
      description: 'Education controversy...'
    },
    {
      id: '4',
      title: '10-year-old boy tragically drowns after SUV-seized foster mother',
      imageUrl: '/images/post4.jpg',
      description: 'Breaking news...'
    },
    {
      id: '5',
      title: 'Tourist who went missing on her first camping trip is rescued',
      imageUrl: '/images/post5.jpg',
      description: 'Rescue operation success...'
    },
    {
      id: '6',
      title: 'Why experts say this city could mean you only have five minutes left to live',
      imageUrl: '/images/post6.jpg',
      description: 'Environmental alert...'
    }
  ];

  const handleVideoClick = (video: any) => {
    setSelectedVideo({
      ...video,
      url: video.videoFile // Map videoFile to url for VideoFeed2
    });
  };

  const handleBackClick = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    setIsCaptionsExpanded(false);
    setIsCommentsOpen(false);
    setIsArticleOpen(false);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCommentsOpen(!isCommentsOpen);
  };

  const toggleCaptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCaptionsExpanded(!isCaptionsExpanded);
  };

  const openArticle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Find a matching article based on the video title or creator
    const article = sampleArticles.find(a => 
      a.title.includes(selectedVideo.title.split(':')[0]) || 
      a.source === selectedVideo.creator.name
    ) || sampleArticles[0];
    
    setSelectedArticle(article);
    setIsArticleOpen(true);
  };

  const renderContent = () => {
    if (selectedVideo) {
      return (
        <div className="absolute inset-0 bg-black z-10">
          <VideoFeed2 
            videos={[selectedVideo]} 
            creatorHandle={typeof handle === 'string' ? handle : undefined} 
            onClose={handleBackClick}
          />
        </div>
      );
    }
    
    switch (activeTab) {
      case 'posts':
        return (
          <div className="grid grid-cols-3 gap-1 mt-1 bg-black p-1 pb-16">
            {sampleVideos.map((video, index) => (
              <div 
                key={index} 
                className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={24} className="text-white opacity-70" />
                </div>
                <div style={{ padding: getResponsiveSize(8) }} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent">
                  <p style={{ fontSize: getResponsiveSize(10) }} className="text-white truncate">{video.title}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'likes':
        return (
          <div className="w-full mt-12 text-center text-gray-500">
            There are no videos here
          </div>
        );
      case 'comments':
        return (
          <div className="w-full mt-12 text-center text-gray-500">
            There are no videos here
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-black text-white overflow-y-auto">
      <style jsx global>{scrollbarHideStyles}</style>
      <div className="relative min-h-full pb-16">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => {
              const lastVideoId = localStorage.getItem('lastVideoId');
              if (lastVideoId) {
                localStorage.removeItem('lastVideoId');
                router.push(`/foryou?v=${lastVideoId}`);
              } else {
                router.push('/foryou');
              }
            }}
            style={{
              width: getResponsiveSize(40),
              height: getResponsiveSize(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              color: 'white',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: getResponsiveSize(20) }}>←</span>
          </button>
        </div>
        
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image - Dark Blue Background */}
          <div style={{ height: getResponsiveSize(192) }} className="bg-blue-900 rounded-b-3xl" />
          
          {/* Profile Info */}
          <div style={{ padding: getResponsiveSize(16) }} className="pb-4">
            <div className="flex flex-col items-center" style={{ marginTop: getResponsiveSize(-140) }}>
              {/* Profile Image */}
              <div style={{ width: getResponsiveSize(100), height: getResponsiveSize(100) }} className="rounded-full overflow-hidden bg-gray-800">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                  style={{ width: getResponsiveSize(100), height: getResponsiveSize(100) }}
                />
              </div>

              {/* Profile Name and Handle */}
              <div className="text-center">
                <h1 style={{ fontSize: getResponsiveSize(16) }} className="font-bold flex items-center justify-center gap-1">
                  {userData.name}
                  <span className="text-[#29ABE2]">
                    <svg 
                      style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </h1>
                <h2 style={{ fontSize: getResponsiveSize(11) }} className="text-gray-400">@{userData.handle}</h2>
              </div>

              {/* Stats */}
              <div style={{ gap: getResponsiveSize(40) }} className="flex mt-3">
                <div className="text-center">
                  <div style={{ fontSize: getResponsiveSize(14) }} className="font-bold">{userData.stats.posts}</div>
                  <div style={{ fontSize: getResponsiveSize(10) }} className="text-gray-400">Posts</div>
                </div>
                <div style={{ marginLeft: getResponsiveSize(20) }} className="text-center">
                  <div style={{ fontSize: getResponsiveSize(14) }} className="font-bold">{userData.stats.followers}</div>
                  <div style={{ fontSize: getResponsiveSize(10) }} className="text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: getResponsiveSize(14) }} className="font-bold">{userData.stats.following}</div>
                  <div style={{ fontSize: getResponsiveSize(10) }} className="text-gray-400">Following</div>
                </div>
              </div>

              {/* Follow and Message Buttons */}
              <div style={{ gap: getResponsiveSize(8) }} className="flex mt-2">
                <button 
                  onClick={() => {}} 
                  style={{ 
                    padding: `${getResponsiveSize(6)} ${getResponsiveSize(12)}`,
                    fontSize: getResponsiveSize(8)
                  }}
                  className="bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
                >
                  Follow
                </button>
                <button 
                  onClick={() => {}} 
                  style={{ 
                    padding: `${getResponsiveSize(6)} ${getResponsiveSize(12)}`,
                    fontSize: getResponsiveSize(8)
                  }}
                  className="bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
                >
                  Message
                </button>
              </div>

              {/* Bio */}
              <p style={{ 
                marginTop: getResponsiveSize(8),
                fontSize: getResponsiveSize(8)
              }} className="text-center text-gray-300">
                {userData.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Grid Column Icons */}
        <div className="w-full flex justify-around mt-1">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`pb-1 px-6 text-sm font-medium ${activeTab === 'posts' ? 'text-blue-500' : 'text-white'}`}
          >
            <Menu size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('likes')}
            className={`pb-1 px-6 text-sm font-medium ${activeTab === 'likes' ? 'text-blue-500' : 'text-white'}`}
          >
            <UserSquare size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`pb-1 px-6 text-sm font-medium ${activeTab === 'comments' ? 'text-blue-500' : 'text-white'}`}
          >
            <Bookmark size={20} />
          </button>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>

      {/* Bottom Navigation - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
} 