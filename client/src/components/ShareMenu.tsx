import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp, FaTelegram, FaLinkedinIn } from "react-icons/fa";
import { FaEnvelope, FaEllipsisH } from "react-icons/fa";

interface ShareMenuProps {
  onClose: () => void;
}

const shareOptions = [
  { id: 1, name: "Facebook", icon: <FaFacebookF className="text-lg" />, color: "bg-blue-600" },
  { id: 2, name: "Instagram", icon: <FaInstagram className="text-lg" />, color: "bg-pink-600" },
  { id: 3, name: "Twitter", icon: <FaTwitter className="text-lg" />, color: "bg-blue-400" },
  { id: 4, name: "WhatsApp", icon: <FaWhatsapp className="text-lg" />, color: "bg-green-500" },
  { id: 5, name: "Telegram", icon: <FaTelegram className="text-lg" />, color: "bg-blue-500" },
  { id: 6, name: "LinkedIn", icon: <FaLinkedinIn className="text-lg" />, color: "bg-blue-700" },
  { id: 7, name: "Email", icon: <FaEnvelope className="text-lg" />, color: "bg-red-600" },
  { id: 8, name: "More", icon: <FaEllipsisH className="text-lg" />, color: "bg-darkGray" }
];

export default function ShareMenu({ onClose }: ShareMenuProps) {
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
          className="w-full max-w-[calc(100vh*9/19.5)] bg-dark rounded-t-3xl p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white">Share to</h3>
            <button 
              className="text-mediumGray"
              onClick={onClose}
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-6 mb-6">
            {shareOptions.map(option => (
              <motion.div 
                key={option.id} 
                className="flex flex-col items-center"
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center mb-2`}>
                  {option.icon}
                </div>
                <span className="text-xs text-white">{option.name}</span>
              </motion.div>
            ))}
          </div>
          
          <div className="border-t border-darkGray pt-4">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 text-center font-medium text-primary"
            >
              Copy link
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
