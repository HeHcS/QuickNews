'use client';

import BottomNav from '@/components/ui/BottomNav';
import { Grid, Video, UserSquare } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts');

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="grid grid-cols-3 gap-1 w-full mt-1">
            {[...Array(27)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        );
      case 'videos':
        return (
          <div className="w-full mt-12 text-center text-gray-500">
            You have no videos here
          </div>
        );
      case 'tagged':
        return (
          <div className="grid grid-cols-3 gap-1 w-full mt-1">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-16 scrollbar-hide">
        {/* Banner and Profile Section */}
        <div className="relative">
          {/* Banner Background */}
          <div className="w-full h-36 bg-blue-600"></div>
          
          {/* Edit Button */}
          <div className="absolute top-4 left-4">
            <button className="bg-transparent border border-white rounded-lg px-4 py-1">
              Edit
            </button>
          </div>

          {/* Profile Picture - Positioned to overlap banner */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-16">
            <div className="w-32 h-32 rounded-full bg-gray-600 border-4 border-black"></div>
          </div>
        </div>

        {/* Profile Info - Added margin top to account for overlapping profile picture */}
        <div className="flex flex-col items-center px-4 mt-[4rem] mb-8">
          {/* Name and Handle */}
          <h1 className="text-lg font-semibold mb-1">Daily Mail</h1>
          <p className="text-yellow-600 mb-8 text-sm">@dailymail</p>

          {/* Stats */}
          <div className="flex justify-center gap-16 w-full max-w-[280px] mb-8 ml-[10px]">
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">140</span>
              <span className="text-xs text-gray-400">Posts</span>
            </div>
            <div className="flex flex-col items-center ml-[11px]">
              <span className="text-sm font-semibold">20K</span>
              <span className="text-xs text-gray-400">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">24K</span>
              <span className="text-xs text-gray-400">Following</span>
            </div>
          </div>

          {/* Grid Navigation */}
          <div className="w-full flex justify-around border-b border-gray-800">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`pb-2 px-6 text-sm font-medium ${activeTab === 'posts' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-white'}`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('videos')}
              className={`pb-2 px-6 text-sm font-medium ${activeTab === 'videos' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-white'}`}
            >
              <Video size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('tagged')}
              className={`pb-2 px-6 text-sm font-medium ${activeTab === 'tagged' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-white'}`}
            >
              <UserSquare size={20} />
            </button>
          </div>

          {/* Content Area */}
          {renderContent()}
        </div>
      </div>

      {/* Fixed Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black">
        <BottomNav />
      </div>
    </div>
  );
} 