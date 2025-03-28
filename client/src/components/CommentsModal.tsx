import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface Comment {
  id: number;
  username: string;
  profilePic: string;
  text: string;
  timeAgo: string;
}

interface CommentsModalProps {
  videoId: number;
  onClose: () => void;
}

// Sample comments data (in a real app, this would come from an API)
const sampleComments: Comment[] = [
  {
    id: 1,
    username: "@techfan",
    profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MXx8cG9ydHJhaXR8ZW58MHx8fHwxNzEzNjE3MjQxfDA&ixlib=rb-4.0.3&q=80&w=1080",
    text: "This is going to be a game changer for smartphone photography! Can't wait to try it.",
    timeAgo: "2h ago"
  },
  {
    id: 2,
    username: "@skeptical",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8cG9ydHJhaXR8ZW58MHx8fHwxNzEzNjE3MjQxfDA&ixlib=rb-4.0.3&q=80&w=1080",
    text: "I'll believe it when I see it. Companies always overpromise on AI features.",
    timeAgo: "1h ago"
  },
  {
    id: 3,
    username: "@photoexpert",
    profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NXx8cG9ydHJhaXR8ZW58MHx8fHwxNzEzNjE3MjQxfDA&ixlib=rb-4.0.3&q=80&w=1080",
    text: "As a professional photographer, I'm excited but cautious. The demo results look promising though!",
    timeAgo: "45m ago"
  }
];

export default function CommentsModal({ videoId, onClose }: CommentsModalProps) {
  const [comments] = useState<Comment[]>(sampleComments);
  const [newComment, setNewComment] = useState("");

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
        onClick={handleBackdropClick}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          className="w-full max-w-[calc(100vh*9/16)] bg-dark rounded-t-3xl p-4 max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">{comments.length} Comments</h3>
            <button 
              className="text-mediumGray"
              onClick={onClose}
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          <div className="space-y-4 mb-16 overflow-y-auto flex-1">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={comment.profilePic} 
                    alt="User profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 text-white">{comment.username}</p>
                  <p className="text-sm text-lightGray">{comment.text}</p>
                  <div className="flex space-x-4 mt-2 text-xs text-mediumGray">
                    <span>{comment.timeAgo}</span>
                    <button>Like</button>
                    <button>Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Comment input */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark border-t border-darkGray max-w-[calc(100vh*9/16)] mx-auto">
            <div className="flex space-x-3 items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTB8fHBvcnRyYWl0fGVufDB8fHx8MTcxMzYxNzI0MXww&ixlib=rb-4.0.3&q=80&w=1080" 
                  alt="Your profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="flex-1 bg-darkGray rounded-full py-2 px-4 text-sm focus:outline-none text-white"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button 
                className="text-primary font-medium text-sm"
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
