import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Import getResponsiveSize function
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

interface Comment {
  _id: string;
  user: {
    name: string;
    profilePicture: string;
  };
  text: string;
  likes: number;
  timestamp: string;
  replies?: Reply[];
}

interface Reply {
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
  isLoading?: boolean;
}

export default function Comments({ isOpen, onClose, comments, isLoading = false }: CommentsProps) {
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the body when comments are open
      document.body.style.overflow = 'hidden';
      
      // Initialize likes state from comments
      const initialCommentLikes: Record<string, number> = {};
      const initialReplyLikes: Record<string, number> = {};
      
      comments.forEach(comment => {
        initialCommentLikes[comment.id] = comment.likes;
        
        if (comment.replies) {
          comment.replies.forEach(reply => {
            initialReplyLikes[reply.id] = reply.likes;
          });
        }
      });
      
      setCommentLikes(initialCommentLikes);
      setReplyLikes(initialReplyLikes);
    } else {
      // Restore normal scrolling when comments are closed
      document.body.style.overflow = '';
    }

    // Cleanup function to ensure we restore normal behavior when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, comments]);

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`w-[360px] tall-screen:w-[720px] h-[70vh] bg-black rounded-t-2xl transform transition-all duration-300 ease-out flex flex-col items-center justify-center ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="text-white/70 mt-4">Loading comments...</p>
        </div>
      </div>
    );
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyClick = (commentId: string) => {
    // Toggle the replies section
    toggleReplies(commentId);
    
    // If we're opening the replies, set this as the active reply
    if (!expandedReplies[commentId]) {
      setActiveReplyId(commentId);
    } else {
      // If we're closing the replies, clear the active reply
      setActiveReplyId(null);
    }
  };

  const handleReplyChange = (commentId: string, text: string) => {
    setReplyText(prev => ({
      ...prev,
      [commentId]: text
    }));
  };

  const handleSubmitReply = (commentId: string) => {
    // In a real app, this would send the reply to the server
    console.log(`Submitting reply for comment ${commentId}: ${replyText[commentId]}`);
    setReplyText(prev => ({
      ...prev,
      [commentId]: ''
    }));
    setActiveReplyId(null);
  };

  const handleCommentLike = (commentId: string) => {
    setLikedComments(prev => {
      const newState = { ...prev };
      newState[commentId] = !newState[commentId];
      return newState;
    });
    
    setCommentLikes(prev => {
      const newLikes = { ...prev };
      if (likedComments[commentId]) {
        // Unlike
        newLikes[commentId] = Math.max(0, newLikes[commentId] - 1);
      } else {
        // Like
        newLikes[commentId] = newLikes[commentId] + 1;
      }
      return newLikes;
    });
  };

  const handleReplyLike = (replyId: string) => {
    setLikedReplies(prev => {
      const newState = { ...prev };
      newState[replyId] = !newState[replyId];
      return newState;
    });
    
    setReplyLikes(prev => {
      const newLikes = { ...prev };
      if (likedReplies[replyId]) {
        // Unlike
        newLikes[replyId] = Math.max(0, newLikes[replyId] - 1);
      } else {
        // Like
        newLikes[replyId] = newLikes[replyId] + 1;
      }
      return newLikes;
    });
  };

//   // Generate placeholder replies if they don't exist
//   const commentsWithReplies = comments.map(comment => {
//     if (!comment.replies) {
//       return {
//         ...comment,
//         replies: [
//           {
//             id: `${comment.id}-reply-1`,
//             user: { name: 'User1', avatar: 'https://picsum.photos/seed/user1/100/100' },
//             text: 'This is a placeholder reply! (◕‿◕✿)',
//             likes: 5,
//             timestamp: '1h ago'
//           }
//         ]
//       };
//     }
//     return comment;
//   });

//   // Add just one placeholder comment if there are no comments
//   const enhancedComments = commentsWithReplies.length === 0 
//     ? [
//         {
//           id: 'placeholder-1',
//           user: { 
//             name: 'KawaiiUser', 
//             avatar: 'https://picsum.photos/seed/kawaii1/100/100' 
//           },
//           text: 'This video is so kawaii! (◕‿◕✿)',
//           likes: 42,
//           timestamp: '2h ago',
//           replies: [
//             {
//               id: 'placeholder-1-reply-1',
//               user: { name: 'KawaiiFan', avatar: 'https://picsum.photos/seed/fan1/100/100' },
//               text: 'Totally agree! This is so kawaii! (◕‿◕✿)',
//               likes: 12,
//               timestamp: '1h ago'
//             }
//           ]
//         }
//       ] 
//     : commentsWithReplies;

  // Create portal content
  const commentsContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-end justify-center transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-auto h-[55.6vh] bg-black rounded-t-2xl transform transition-all duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          width: 'calc(55.6vh * 9/16 * 1.8)',
          maxWidth: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">{enhancedComments.length} Comments</span>
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
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {enhancedComments.map((comment) => (
            <div key={comment.id} className="flex gap-2 p-2 hover:bg-white/5">
              <img 
                src={comment.user.profilePicture} 
                alt={comment.user.name}
                className="rounded-full"
                style={{ 
                  width: getResponsiveSize(32), 
                  height: getResponsiveSize(32) 
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: getResponsiveSize(12) }} className="font-semibold text-white">{comment.user.name}</span>
                  <span style={{ fontSize: getResponsiveSize(10) }} className="text-white/50">{comment.timestamp}</span>
                </div>
                <p style={{ fontSize: getResponsiveSize(12) }} className="mt-1 text-white">{comment.text}</p>
                <div className="flex items-center gap-3 mt-1">
                  <button 
                    onClick={() => handleCommentLike(comment.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedComments[comment.id] ? 'text-red-500' : 'text-white/70 hover:text-white'
                    }`}
                    style={{ fontSize: getResponsiveSize(10) }}
                  >
                    <span>{likedComments[comment.id] ? '❤️' : '🤍'}</span>
                    <span>{commentLikes[comment.id] || comment.likes}</span>
                  </button>
                  <button 
                    onClick={() => handleReplyClick(comment.id)}
                    className="text-white/70 hover:text-white"
                    style={{ fontSize: getResponsiveSize(10) }}
                  >
                    💬 Reply
                  </button>
                </div>

                {/* Replies Section */}
                {expandedReplies[comment.id] && (
                  <div className="mt-3 pl-4 border-l-2 border-white/10">
                    {/* Reply Input Field */}
                    {activeReplyId === comment.id && (
                      <div className="flex gap-2 mb-3">
                        <input 
                          type="text" 
                          value={replyText[comment.id] || ''}
                          onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-white/10 rounded-full px-3 py-1.5 text-white placeholder-white/50 focus:outline-none"
                          style={{ fontSize: getResponsiveSize(12) }}
                        />
                        <button 
                          onClick={() => handleSubmitReply(comment.id)}
                          className="px-3 py-1.5 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
                          style={{ fontSize: getResponsiveSize(12) }}
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {/* Replies List */}
                    {comment.replies && comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-1 mb-2">
                        <img 
                          src={reply.user.avatar} 
                          alt={reply.user.name}
                          className="rounded-full"
                          style={{ 
                            width: getResponsiveSize(20), 
                            height: getResponsiveSize(20) 
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: getResponsiveSize(10) }} className="font-medium text-white">{reply.user.name}</span>
                            <span style={{ fontSize: getResponsiveSize(9) }} className="text-white/50">{reply.timestamp}</span>
                          </div>
                          <p style={{ fontSize: getResponsiveSize(10) }} className="mt-0.5 text-white">{reply.text}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <button 
                              onClick={() => handleReplyLike(reply.id)}
                              className={`flex items-center gap-1 transition-colors ${
                                likedReplies[reply.id] ? 'text-red-500' : 'text-white/70 hover:text-white'
                              }`}
                              style={{ fontSize: getResponsiveSize(10) }}
                            >
                              <span>{likedReplies[reply.id] ? '❤️' : '🤍'}</span>
                              <span>{replyLikes[reply.id] || reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show/Hide Replies Button */}
                    <button 
                      onClick={() => toggleReplies(comment.id)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      style={{ fontSize: getResponsiveSize(10) }}
                    >
                      {expandedReplies[comment.id] ? 'Hide replies' : 'Show replies'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="sticky bottom-0 p-3 border-t border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: getResponsiveSize(12) }}
            />
            <button 
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
              style={{ fontSize: getResponsiveSize(12) }}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at root level
  return typeof document !== 'undefined' 
    ? createPortal(commentsContent, document.body)
    : null;
} 