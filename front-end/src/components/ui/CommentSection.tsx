'use client';

import { useEffect, useRef } from 'react';

// Import getResponsiveSize function
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  likes: number;
  timestamp: string;
}

interface CommentSectionProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
}

export default function CommentSection({ isOpen, onClose, comments }: CommentSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div
        ref={sectionRef}
        className="bg-black w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden animate-slide-up shadow-lg"
      >
        {/* Handle */}
        <div className="w-full flex justify-center pt-2">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 style={{ fontSize: getResponsiveSize(18) }} className="text-white font-semibold">Comments</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] px-4 pb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 mb-4 bg-white/5 p-3 rounded-xl">
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="rounded-full"
                style={{ 
                  width: getResponsiveSize(32), 
                  height: getResponsiveSize(32) 
                }}
              />
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <span style={{ fontSize: getResponsiveSize(14) }} className="text-white font-medium">{comment.user.name}</span>
                  <span style={{ fontSize: getResponsiveSize(12) }} className="text-white/50">{comment.timestamp}</span>
                </div>
                <p style={{ fontSize: getResponsiveSize(14) }} className="text-white/90 mt-1">{comment.text}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button style={{ fontSize: getResponsiveSize(12) }} className="text-white/50 hover:text-white flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{comment.likes}</span>
                  </button>
                  <button style={{ fontSize: getResponsiveSize(12) }} className="text-white/50 hover:text-white">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="p-4 bg-black/90 backdrop-blur-lg border-t border-white/10">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 text-white rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: getResponsiveSize(14) }}
            />
            <button 
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
              style={{ fontSize: getResponsiveSize(14) }}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 