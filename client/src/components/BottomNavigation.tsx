import { motion } from "framer-motion";
import { 
  FaHome, 
  FaCompass, 
  FaPlus, 
  FaBell, 
  FaUser 
} from "react-icons/fa";

export default function BottomNavigation() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark border-t border-darkGray z-20 max-w-[calc(100vh*9/16)] mx-auto">
      <div className="flex justify-around items-center py-2">
        <NavItem icon={<FaHome className="text-xl" />} label="Home" active />
        <NavItem icon={<FaCompass className="text-xl" />} label="Discover" />
        <CreateButton />
        <NavItem icon={<FaBell className="text-xl" />} label="Alerts" />
        <NavItem icon={<FaUser className="text-xl" />} label="Profile" />
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <motion.a 
      href="#" 
      className={`flex flex-col items-center px-3 py-1 ${
        active ? "text-primary" : "text-mediumGray"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </motion.a>
  );
}

function CreateButton() {
  return (
    <motion.a 
      href="#" 
      className="flex flex-col items-center px-0 py-0"
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-12 h-10 rounded-md bg-gradient-to-r from-primary to-secondary flex items-center justify-center -mt-6 mb-1 shadow-lg">
        <FaPlus className="text-white text-lg" />
      </div>
    </motion.a>
  );
}
