import { useState } from "react";
import { motion } from "framer-motion";
import { Video } from "@/types/video";
import { FaHeart, FaCommentDots, FaBookmark, FaShare, FaPlus } from "react-icons/fa";

interface VideoCardProps {
  video: Video;
  active: boolean;
  onOpenComments: () => void;
  onOpenShare: () => void;
}

export default function VideoCard({ video, active, onOpenComments, onOpenShare }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleBookmark = () => {
    setSaved(!saved);
  };

  return (
    <div 
      className="video-container relative h-screen w-full bg-dark"
      style={{ scrollSnapAlign: "start" }}
    >
      <img 
        src={video.thumbnailUrl} 
        alt={video.title} 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      
      {/* Overlay gradient for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
      
      {/* Video Info */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        <h3 className="font-bold text-lg mb-1 text-white">{video.title}</h3>
        <p className="text-sm text-lightGray mb-2">{video.username}</p>
        <p className="text-xs text-lightGray line-clamp-2">{video.description}</p>
      </div>
      
      {/* Right side action buttons */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center space-y-6 z-10">
        {/* Profile */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden mb-1 relative">
            <img 
              src={video.creatorProfilePic} 
              alt="Creator profile" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute -bottom-1 right-0">
              <FaPlus className="text-xs bg-primary text-white p-1 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Like */}
        <div className="flex flex-col items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="action-btn"
          >
            <FaHeart className={`text-3xl ${liked ? 'text-primary' : 'text-white'}`} />
          </motion.button>
          <span className="text-xs mt-1 text-white">{liked ? video.likesCount + 1 : video.likesCount}</span>
        </div>
        
        {/* Comments */}
        <div className="flex flex-col items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onOpenComments}
            className="action-btn"
          >
            <FaCommentDots className="text-3xl text-white" />
          </motion.button>
          <span className="text-xs mt-1 text-white">{video.commentsCount}</span>
        </div>
        
        {/* Bookmark */}
        <div className="flex flex-col items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBookmark}
            className="action-btn"
          >
            <FaBookmark className={`text-3xl ${saved ? 'text-primary' : 'text-white'}`} />
          </motion.button>
          <span className="text-xs mt-1 text-white">Save</span>
        </div>
        
        {/* Share */}
        <div className="flex flex-col items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onOpenShare}
            className="action-btn"
          >
            <FaShare className="text-3xl text-white" />
          </motion.button>
          <span className="text-xs mt-1 text-white">Share</span>
        </div>
        
        {/* Sound */}
        <div className="flex flex-col items-center">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="action-btn relative w-12 h-12 rounded-full overflow-hidden border-2 border-white"
          >
            <img 
              src={video.creatorProfilePic} 
              alt="Sound" 
              className="w-full h-full object-cover" 
            />
          </motion.button>
          <span className="text-xs mt-1 text-white">Sound</span>
        </div>
      </div>
      
      {/* Time indicator */}
      <div className="absolute top-16 right-4 bg-black/50 px-2 py-1 rounded-full text-xs text-white">
        <span>{video.duration}</span>
      </div>
      
      {/* Topic tag or Live indicator */}
      {video.isLive ? (
        <div className="absolute top-16 left-4 bg-red-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
          <span className="text-white">LIVE</span>
        </div>
      ) : (
        <div className="absolute top-16 left-4 bg-primary px-2 py-1 rounded-full text-xs font-medium text-white">
          <span>{video.topic}</span>
        </div>
      )}
    </div>
  );
}
