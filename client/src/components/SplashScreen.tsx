import { FaBolt } from "react-icons/fa";
import { FaNewspaper } from "react-icons/fa";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark">
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
            <FaBolt className="text-white text-3xl" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
            <FaNewspaper className="text-dark text-xs" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">QuickNews</h1>
        <p className="text-mediumGray text-sm mb-8">News that keeps up with you</p>
        <div className="w-12 h-12 border-t-4 border-primary border-r-4 border-secondary rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
