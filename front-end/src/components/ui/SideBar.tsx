'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Bell, Settings, LogOut, User, Bookmark, HelpCircle, Shield, Lock, AtSign, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { API_ENDPOINTS } from '../../config/api';

// Calculate responsive sizes based on viewport height (700px reference)
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideBar({ isOpen, onClose }: SideBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // First set visible to true to render the component
      setIsVisible(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Add a small delay before starting the animation
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to ensure the component is rendered first
    } else {
      // Start closing animation
      setIsAnimating(false);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set a timeout to hide the sidebar after animation completes
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with CSS transition duration
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    // Start closing animation
    setIsAnimating(false);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to call onClose after animation completes
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 300); // Match this with CSS transition duration
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out pointer-events-auto
          ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div 
        className={`absolute top-0 left-0 h-full bg-black transition-transform duration-300 ease-out pointer-events-auto
          ${isAnimating ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: getResponsiveSize(280) }}
      >
        {/* Back Button */}
        <button 
          onClick={handleClose}
          style={{ 
            padding: getResponsiveSize(8),
            fontSize: getResponsiveSize(14)
          }}
          className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors flex items-center gap-1"
        >
          <ChevronLeft style={{ width: getResponsiveSize(20), height: getResponsiveSize(20) }} />
          <span className="font-medium">Back</span>
        </button>

        {/* User Profile */}
        <div style={{ padding: getResponsiveSize(24) }} className="border-b border-white/10 mt-12">
          <div className="flex items-center gap-4">
            <div style={{ width: getResponsiveSize(48), height: getResponsiveSize(48) }} className="rounded-full bg-gradient-to-br from-[#29ABE2] to-[#1E88C5] overflow-hidden border-2 border-white/20">
              <Image
                src={API_ENDPOINTS.STATIC.DEFAULT_PROFILE}
                alt="User Profile"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <h3 style={{ fontSize: getResponsiveSize(16) }} className="font-medium text-white">Guest</h3>
              <p style={{ fontSize: getResponsiveSize(12) }} className="text-white/60">@guest</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="absolute bottom-0 left-0 right-0">
          <nav style={{ padding: getResponsiveSize(12) }}>
            <ul style={{ gap: getResponsiveSize(2) }} className="flex flex-col">
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <User style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Edit your profile</span>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Bookmark style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Bookmarks</span>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <AtSign style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Mentions</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span style={{ fontSize: getResponsiveSize(10) }} className="text-white/40">Everyone</span>
                    <ChevronRight style={{ width: getResponsiveSize(12), height: getResponsiveSize(12) }} className="text-white/40" />
                  </div>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <div style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="rounded-full bg-green-500"></div>
                  <span>Online status</span>
                  <div className="ml-auto flex items-center gap-1">
                    <span style={{ fontSize: getResponsiveSize(10) }} className="text-white/40">Everyone</span>
                    <ChevronRight style={{ width: getResponsiveSize(12), height: getResponsiveSize(12) }} className="text-white/40" />
                  </div>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Bell style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Mute Notifications</span>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Shield style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Block</span>
                </button>
              </li>
              <li>
                <button style={{ 
                  padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
                  fontSize: getResponsiveSize(12)
                }} className="w-full flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Lock style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} className="text-[#29ABE2]" />
                  <span>Privacy setting</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Logout Button */}
          <div style={{ padding: getResponsiveSize(12) }} className="border-t border-white/10">
            <button style={{ 
              padding: `${getResponsiveSize(8)} ${getResponsiveSize(12)}`,
              fontSize: getResponsiveSize(12)
            }} className="w-full flex items-center gap-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
              <LogOut style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 