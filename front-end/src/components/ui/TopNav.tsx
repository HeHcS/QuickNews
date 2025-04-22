'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail, Menu } from 'lucide-react';
import SideBar from './SideBar';

const categories = [
  { name: 'Breaking', path: '/breaking' },
  { name: 'Politics', path: '/politics' },
  { name: 'For You', path: '/' },
  { name: 'Tech', path: '/tech' },
  { name: 'Business', path: '/business' },
  { name: 'Followed', path: '/following' }
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Set active category based on current path
    const currentCategory = categories.find(cat => cat.path === pathname)?.name || 'For You';
    setActiveCategory(currentCategory);
  }, [pathname]);

  const handleCategoryClick = (category: { name: string, path: string }) => {
    setActiveCategory(category.name);
    router.push(category.path);
  };

  return (
    <>
      <div className="absolute top-12 left-0 right-0 z-20">
        {/* Navigation Container */}
        <div className="relative w-full flex justify-center">
          <div className="flex items-center justify-between w-full px-3">
            {/* Menu Icon */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors select-none"
            >
              <Menu size={24} strokeWidth={2.5} className="transform transition-transform duration-300 hover:scale-110" />
            </button>

            {/* Categories */}
            <div className="flex space-x-0.5 overflow-x-auto scrollbar-hide items-center max-w-[280px] bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-1 select-none">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-1.5 py-1 text-[8px] font-medium rounded-full whitespace-nowrap transition-colors select-none
                    ${activeCategory === category.name
                      ? 'bg-[#29ABE2] text-white'
                      : 'text-white/90 hover:text-white'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Mail Icon */}
            <button className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-colors select-none">
              <Mail size={24} strokeWidth={2.5} className="transform transition-transform duration-300 hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
} 