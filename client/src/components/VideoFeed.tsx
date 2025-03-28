import { useState, useRef, useEffect } from "react";
import VideoCard from "./VideoCard";
import AppDownloadPromo from "./AppDownloadPromo";
import { Video } from "@/types/video";

interface VideoFeedProps {
  videos: Video[];
  onOpenComments: (videoId: number) => void;
  onOpenShare: (videoId: number) => void;
}

export default function VideoFeed({ videos, onOpenComments, onOpenShare }: VideoFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add scroll snap behavior
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const containerHeight = scrollContainerRef.current.clientHeight;
        const scrollPosition = scrollContainerRef.current.scrollTop;
        const newIndex = Math.round(scrollPosition / containerHeight);
        
        if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [activeIndex]);

  return (
    <div 
      ref={scrollContainerRef}
      className="video-scroll-container no-scrollbar h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory", overscrollBehaviorY: "contain" }}
    >
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          active={index === activeIndex}
          onOpenComments={() => onOpenComments(video.id)}
          onOpenShare={() => onOpenShare(video.id)}
        />
      ))}
      
      <AppDownloadPromo />
    </div>
  );
}
