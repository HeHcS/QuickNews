'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Link as LinkIcon, UserRound } from 'lucide-react';

interface NavItem {
  id: string;
  icon: string | ReactNode;
  isImage: boolean;
  path: string;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    // Update active page based on current path
    const path = pathname.slice(1) || 'home';
    setActivePage(path);
  }, [pathname]);

  const navItems: NavItem[] = [
    { id: 'home', icon: '/assets/mainQuickIcon.png', isImage: true, path: '/' },
    { id: 'messages', icon: <LinkIcon size={24} />, isImage: false, path: '/messages' },
    { id: 'create', icon: '/assets/bottomCreate.png', isImage: true, path: '/create' },
    { id: 'search', icon: '/assets/bottomSearch.png', isImage: true, path: '/search' },
    { id: 'profile', icon: <UserRound size={24} />, isImage: false, path: '/profile' },
  ];

  const handleNavigation = (path: string, id: string) => {
    setActivePage(id);
    router.push(path);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A] rounded-full px-4 py-2 shadow-lg">
      <div className="flex items-center space-x-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path, item.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors duration-200 ${
              activePage === item.id ? 'bg-blue-500' : 'hover:opacity-80'
            }`}
          >
            {item.isImage ? (
              <Image 
                src={item.icon as string}
                alt={item.id}
                width={24}
                height={24}
                className="transform transition-transform duration-300"
              />
            ) : (
              <span className="text-xl">{item.icon}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 