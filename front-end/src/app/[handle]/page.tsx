'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';
import { Menu, Play, UserSquare, Bookmark, Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import Comments from '@/components/ui/Comments';
import ArticlePopup from '@/components/ui/ArticlePopup';
import VideoFeed2 from '@/components/ui/VideoFeed2';
import axios from 'axios';
import Image from 'next/image';

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

// Add this interface near the top of the file with other interfaces
interface VideoData {
  _id: string;
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  videoFile: string;
  creator: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const handle = (params?.handle as string)?.replace('@', '') || '';
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    name: '',
    handle: handle,
    avatar: `https://quick-news-backend.vercel.app/uploads/profiles/default-profile.png`,
    bio: 'Feed your daily addiction with the biggest stories from news, politics, showbiz and everything else.',
    stats: {
      posts: 134,
      followers: '20.8m',
      following: 208
    }
  });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isArticlePopupOpen, setIsArticlePopupOpen] = useState(false);

  const handleVideoClick = (video: any, index: number) => {
    setSelectedVideo(video);
    setSelectedVideoIndex(index);
  };

  const resetVideoState = () => {
    setSelectedVideo(null);
  };

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const handleLower = handle.toLowerCase();
        const profileRes = await axios.get(`https://quick-news-backend.vercel.app/api/profile/handle/${handleLower}`);
        const profile = profileRes.data?.data?.profile;
        const creatorId = profile?._id;
        if (!creatorId) throw new Error('Creator not found');
        
        // Update user data with actual name from profile
        setUserData(prev => ({
          ...prev,
          name: profile.name || '',
          avatar: profile.profilePicture ? `https://quick-news-backend.vercel.app/uploads/profiles/${profile.profilePicture}` : prev.avatar,
          bio: profile.bio || prev.bio
        }));

        const videosRes = await axios.get(`https://quick-news-backend.vercel.app/api/videos/creator/${creatorId}`);
        // Process videos to include full URLs for thumbnails
        const processedVideos = (videosRes.data?.videos || []).map((video: VideoData) => ({
          ...video,
          thumbnail: video.thumbnail ? `https://quick-news-backend.vercel.app/uploads/thumbnails/${video.thumbnail}` : '/default-thumbnail.png'
        }));
        setVideos(processedVideos);
      } catch (err) {
        setError('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [handle]);

  if (selectedVideo) {
    // Only show the creator feed (VideoFeed2) when a video is selected
    return (
      <div className="h-screen w-full bg-black text-white">
        <VideoFeed2 
          creatorHandle={handle} 
          onClose={resetVideoState}
          initialVideoIndex={selectedVideoIndex}
          onArticleOpenChange={setIsArticlePopupOpen}
        />
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {isArticlePopupOpen ? null : <BottomNav />}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-y-auto">
      <style jsx global>{scrollbarHideStyles}</style>
      <div className="relative min-h-full pb-16">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image - Dark Blue Background */}
          <div style={{ height: getResponsiveSize(192) }} className="bg-blue-900 rounded-b-3xl relative z-0">
            {/* Back Button in Blue Box */}
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 z-[5] bg-black/30 rounded-full p-2 hover:bg-black/50 transition-colors flex items-center justify-center"
              style={{ 
                width: getResponsiveSize(40), 
                height: getResponsiveSize(40),
                fontSize: getResponsiveSize(16)
              }}
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
          </div>
          
          {/* Profile Info */}
          <div style={{ padding: getResponsiveSize(16) }} className="pb-4 relative z-10">
            <div className="flex flex-col items-center" style={{ marginTop: getResponsiveSize(-140) }}>
              {/* Profile Image */}
              <div style={{ width: getResponsiveSize(100), height: getResponsiveSize(100) }} className="rounded-full overflow-hidden bg-gray-800 relative z-20">
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
                  {/* Verified badge from /assets/Vector (1).svg in public/assets */}
                  <span>
                    <Image
                      src="/assets/Vector (1).svg"
                      alt="Verified"
                      width={18}
                      height={18}
                      style={{
                        width: getResponsiveSize(18),
                        height: getResponsiveSize(18),
                        display: 'inline-block',
                        verticalAlign: 'middle'
                      }}
                    />
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
        {activeTab === 'posts' ? (
          loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="h-40 flex items-center justify-center text-red-500">{error}</div>
          ) : videos.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400">No videos found for this creator.</div>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-1 bg-black p-1 pb-16">
              {videos.map((video, index) => (
                <div 
                  key={video._id || video.id || index} 
                  className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleVideoClick(video, index)}
                >
                  {/* Video Thumbnail */}
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ zIndex: 1 }}
                    />
                  )}
                  {/* Title Overlay */}
                  <div style={{ padding: getResponsiveSize(8), zIndex: 3 }} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent">
                    <p style={{ fontSize: getResponsiveSize(10) }} className="text-white truncate">{video.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="w-full mt-12 text-center text-gray-500">
            There are no videos here
          </div>
        )}
      </div>

      {/* Bottom Navigation - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {isArticlePopupOpen ? null : <BottomNav />}
      </div>
    </div>
  );
} 