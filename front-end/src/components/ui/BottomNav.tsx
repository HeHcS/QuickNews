'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Link as LinkIcon, UserRound } from 'lucide-react';
import { getResponsiveSize } from '@/utils/responsiveSize';

interface NavItem {
  id: string;
  icon: string | ReactNode;
  isImage: boolean;
  path: string;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activePage, setActivePage] = useState('');

  useEffect(() => {
    // Update active page based on current path
    const path = pathname.slice(1);
    const matchingItem = navItems.find(item => item.path === pathname);
    setActivePage(matchingItem ? matchingItem.id : path || 'home');
  }, [pathname]);

  const navItems: NavItem[] = [
    { id: 'home', icon: '/assets/mainQuickIcon.png', isImage: true, path: '/' },
    { id: 'messages', icon: <LinkIcon size={24} />, isImage: false, path: '/messages' },
    { id: 'create', icon: '/assets/bottomCreate.png', isImage: true, path: '/create' },
    { id: 'search', icon: '/assets/bottomSearch.png', isImage: true, path: '/search' },
    { id: 'profile', icon: <UserRound size={24} />, isImage: false, path: '/profile' },
  ];

  const handleNavigation = (path: string, id: string) => {
    router.push(path);
  };

  return (
    <div style={{ 
      bottom: getResponsiveSize(12),
      padding: `${getResponsiveSize(6)} ${getResponsiveSize(16)}`,
      gap: getResponsiveSize(20),
      width: getResponsiveSize(320)
    }} className="fixed left-1/2 -translate-x-1/2 bg-[#1A1A1A] rounded-full shadow-lg z-[50]">
      <div className="flex items-center justify-between w-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path, item.id)}
            style={{
              width: getResponsiveSize(40),
              height: getResponsiveSize(40)
            }}
            className={`rounded-full flex items-center justify-center text-white transition-all duration-300 ${
              pathname === item.path ? 'bg-blue-500' : 'hover:opacity-80'
            }`}
          >
            {item.isImage ? (
              <div style={{ width: getResponsiveSize(24), height: getResponsiveSize(24) }}>
                <Image 
                  src={item.icon as string}
                  alt={item.id}
                  width={24}
                  height={24}
                  className="w-full h-full transform transition-transform duration-300"
                />
              </div>
            ) : (
              <div style={{ width: getResponsiveSize(24), height: getResponsiveSize(24) }}>
                {item.id === 'messages' ? (
                  <LinkIcon size={24} className="w-full h-full" />
                ) : (
                  <UserRound size={24} className="w-full h-full" />
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 