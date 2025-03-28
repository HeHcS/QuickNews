import { motion } from "framer-motion";

interface TutorialOverlayProps {
  onClose: () => void;
}

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-end justify-center p-4 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark rounded-xl p-4 border border-primary w-full max-w-md"
      >
        <h3 className="font-bold text-lg mb-2 text-white">Welcome to QuickNews!</h3>
        <p className="text-mediumGray text-sm mb-4">
          Swipe up ↑ to see the next video and discover breaking news from around the world.
        </p>
        
        <div className="flex justify-end">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="font-medium text-primary"
            onClick={onClose}
          >
            Got it
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
