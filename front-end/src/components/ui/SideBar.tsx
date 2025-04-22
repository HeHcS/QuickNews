'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Bell, Settings, LogOut, User, Bookmark, HelpCircle, Shield, Lock, AtSign, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideBar({ isOpen, onClose }: SideBarProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Show the sidebar immediately
      setIsVisible(true);
      // Reset closing state
      setIsClosing(false);
    } else {
      // Start closing animation
      setIsClosing(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set a timeout to hide the sidebar after animation completes
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Set a timeout to call onClose after animation completes
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {/* Backdrop - only active when sidebar is open */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out pointer-events-auto
          ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sidebar - only active when sidebar is open */}
      <div 
        className={`absolute top-0 left-0 h-full w-[78%] bg-black transform transition-all duration-300 ease-out
          ${isOpen && !isClosing ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}`}
      >
        {/* Back Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 text-white/70 hover:text-white transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* User Profile */}
        <div className="p-6 border-b border-white/10 mt-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#29ABE2] to-[#1E88C5] overflow-hidden border-2 border-white/20">
              <Image
                src="/default-avatar.svg"
                alt="Profile"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-base text-white">User Name</h3>
              <p className="text-xs text-white/60">@username</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="absolute bottom-0 left-0 right-0">
          <nav className="p-4">
            <ul className="space-y-1">
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <User size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Edit your profile</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Bookmark size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Bookmarks</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <AtSign size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Mentions</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-white/40">Everyone</span>
                    <ChevronRight size={14} className="text-white/40" />
                  </div>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <div className="w-[18px] h-[18px] rounded-full bg-green-500"></div>
                  <span className="text-sm">Online status</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-white/40">Everyone</span>
                    <ChevronRight size={14} className="text-white/40" />
                  </div>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Bell size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Mute Notifications</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Shield size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Block</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Lock size={18} className="text-[#29ABE2]" />
                  <span className="text-sm">Privacy setting</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 