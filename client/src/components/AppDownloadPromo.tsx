import { motion } from "framer-motion";
import { FaTwitter, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

export default function AppDownloadPromo() {
  return (
    <div 
      className="video-container relative h-screen w-full bg-gradient-to-br from-dark via-darkGray to-primary/20 flex flex-col items-center justify-center p-6"
      style={{ scrollSnapAlign: "start" }}
    >
      <motion.img 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8bW9iaWxlJTIwYXBwJTIwaW50ZXJmYWNlJTIwZWxlbWVudHN8ZW58MHx8fHwxNzEzNjE3MzM1fDA&ixlib=rb-4.0.3&q=80&w=1080" 
        alt="QuickNews app preview" 
        className="w-60 h-auto rounded-3xl shadow-2xl mb-6 border-4 border-darkGray" 
      />
      
      <motion.h2 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-xl font-bold mb-2 text-center text-white"
      >
        Get the full experience
      </motion.h2>

      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-mediumGray text-center mb-6 text-sm"
      >
        Download the QuickNews app to customize your feed and never miss a breaking story
      </motion.p>
      
      <motion.button 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        className="bg-primary text-white py-3 px-8 rounded-full font-bold mb-4 w-full max-w-xs"
      >
        Download Now
      </motion.button>
      
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex space-x-4 mb-6"
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" 
          alt="Get it on Google Play" 
          className="h-9"
        />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" 
          alt="Download on App Store" 
          className="h-9"
        />
      </motion.div>
      
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex space-x-4"
      >
        <a href="#" className="text-primary" aria-label="Twitter">
          <FaTwitter className="text-xl" />
        </a>
        <a href="#" className="text-primary" aria-label="Instagram">
          <FaInstagram className="text-xl" />
        </a>
        <a href="#" className="text-primary" aria-label="Facebook">
          <FaFacebook className="text-xl" />
        </a>
        <a href="#" className="text-primary" aria-label="YouTube">
          <FaYoutube className="text-xl" />
        </a>
      </motion.div>
    </div>
  );
}
