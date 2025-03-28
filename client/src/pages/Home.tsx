import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import VideoFeed from "@/components/VideoFeed";
import TopicsHeader from "@/components/TopicsHeader";
import BottomNavigation from "@/components/BottomNavigation";
import CommentsModal from "@/components/CommentsModal";
import ShareMenu from "@/components/ShareMenu";
import TutorialOverlay from "@/components/TutorialOverlay";
import useFirstVisit from "@/hooks/useFirstVisit";
import { mockVideos } from "@/data/mockVideos"; 

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isFirstVisit = useFirstVisit();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Show tutorial for first-time visitors after a short delay
      if (isFirstVisit) {
        setTimeout(() => {
          setShowTutorial(true);
        }, 2000);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isFirstVisit]);

  const handleOpenComments = (videoId: number) => {
    setCurrentVideoId(videoId);
    setShowCommentsModal(true);
  };

  const handleOpenShare = (videoId: number) => {
    setCurrentVideoId(videoId);
    setShowShareMenu(true);
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className="relative h-full overflow-hidden bg-dark">
      <VideoFeed 
        videos={mockVideos} 
        onOpenComments={handleOpenComments}
        onOpenShare={handleOpenShare}
      />
      <TopicsHeader />
      <BottomNavigation />
      
      {showCommentsModal && (
        <CommentsModal 
          videoId={currentVideoId!}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
      
      {showShareMenu && (
        <ShareMenu onClose={() => setShowShareMenu(false)} />
      )}
      
      {showTutorial && (
        <TutorialOverlay onClose={handleCloseTutorial} />
      )}
    </div>
  );
}
