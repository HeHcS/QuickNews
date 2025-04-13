import React, { useEffect } from 'react';

interface Comment {
  id: string;
  user: { name: string; avatar: string };
  text: string;
  likes: number;
  timestamp: string;
}

interface CommentsProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
}

export default function Comments({ isOpen, onClose, comments }: CommentsProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the body when comments are open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore normal scrolling when comments are closed
      document.body.style.overflow = '';
    }

    // Cleanup function to ensure we restore normal behavior when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className={`w-[360px] tall-screen:w-[720px] h-[70vh] bg-black rounded-t-2xl transform transition-all duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">{comments.length} Comments</span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white text-xl rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95"
            aria-label="Close comments"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 hover:bg-white/5">
              <img 
                src={comment.user.avatar} 
                alt={comment.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{comment.user.name}</span>
                  <span className="text-white/50 text-xs">{comment.timestamp}</span>
                </div>
                <p className="text-sm mt-1 text-white">{comment.text}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1 text-white/70 hover:text-white text-xs">
                    <span>❤️</span>
                    <span>{comment.likes}</span>
                  </button>
                  <button className="text-white/70 hover:text-white text-xs">💬 Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input - Now sticky at the bottom */}
        <div className="sticky bottom-0 p-3 border-t border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 