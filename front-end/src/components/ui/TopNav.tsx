'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import SideBar from './SideBar';

// Calculate responsive sizes based on viewport height (700px reference)
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

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
          <div className="flex items-center justify-between w-full px-2">
            {/* Menu Icon */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{ width: getResponsiveSize(24), height: getResponsiveSize(24) }}
              className="flex items-center justify-center text-white hover:text-white/80 transition-colors select-none"
            >
              <Menu style={{ width: getResponsiveSize(18), height: getResponsiveSize(18) }} strokeWidth={2.5} className="transform transition-transform duration-300 hover:scale-110" />
            </button>

            {/* Categories */}
            <div style={{ gap: getResponsiveSize(1), maxWidth: getResponsiveSize(280) }} className="flex overflow-x-auto scrollbar-hide items-center bg-black/30 backdrop-blur-sm rounded-full px-1 py-0.5 select-none">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category)}
                  style={{ 
                    padding: `${getResponsiveSize(3)} ${getResponsiveSize(5)}`,
                    fontSize: getResponsiveSize(7)
                  }}
                  className={`font-medium rounded-full whitespace-nowrap transition-colors select-none
                    ${activeCategory === category.name
                      ? 'bg-[#29ABE2] text-white'
                      : 'text-white/90 hover:text-white'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Log in Button */}
            <button 
              onClick={() => router.push('/create')}
              style={{ 
                padding: `${getResponsiveSize(3)} ${getResponsiveSize(7)}`,
                fontSize: getResponsiveSize(8)
              }}
              className="bg-[#29ABE2] text-white font-medium rounded-full hover:bg-[#29ABE2]/80 transition-colors select-none"
            >
              Log in
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
} 