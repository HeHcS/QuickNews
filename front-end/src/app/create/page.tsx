'use client';

import BottomNav from '@/components/ui/BottomNav';
import { useState } from 'react';

export default function CreatePage() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-800 relative">
        <h1 className="text-lg font-semibold">Create Post</h1>
        <button className="text-blue-500 font-medium absolute right-4">
          Post
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div 
          className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center mb-4 transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
        >
          <span className="text-4xl mb-2">📹</span>
          <p className="text-white/70 text-sm">Drag and drop video here</p>
          <p className="text-white/50 text-xs mt-1">or tap to upload</p>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Write a title..."
            className="w-full bg-transparent border-b border-gray-800 pb-2 text-lg font-medium placeholder-white/50 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <textarea 
            placeholder="Add a description..."
            className="w-full bg-transparent border-b border-gray-800 pb-2 text-sm placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          {/* Location */}
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-xl">📍</span>
            <input 
              type="text" 
              placeholder="Add location"
              className="flex-1 bg-transparent placeholder-white/50 focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-xl">🏷️</span>
            <input 
              type="text" 
              placeholder="Add tags"
              className="flex-1 bg-transparent placeholder-white/50 focus:outline-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-xl">👁️</span>
            <select className="flex-1 bg-transparent focus:outline-none">
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-800">
        <BottomNav />
      </div>
    </div>
  );
} 