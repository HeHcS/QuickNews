'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    // Update active page based on current path
    const path = pathname.slice(1) || 'home';
    setActivePage(path);
  }, [pathname]);

  const navItems = [
    { id: 'home', icon: '🏠', path: '/' },
    { id: 'messages', icon: '💬', path: '/messages' },
    { id: 'create', icon: '➕', path: '/create' },
    { id: 'search', icon: '🔍', path: '/search' },
    { id: 'profile', icon: '👤', path: '/profile' },
  ];

  const handleNavigation = (path: string, id: string) => {
    setActivePage(id);
    router.push(path);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2">
      <div className="flex items-center space-x-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path, item.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors duration-200 ${
              activePage === item.id ? 'bg-blue-500' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 