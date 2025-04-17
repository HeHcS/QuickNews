'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail } from 'lucide-react';

const categories = [
  { name: 'Breaking', path: '/breaking' },
  { name: 'Politics', path: '/politics' },
  { name: 'For You', path: '/' },
  { name: 'Tech', path: '/tech' },
  { name: 'Business', path: '/business' },
  { name: 'Subscribed', path: '/following' }
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState('For You');

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
    <div className="absolute top-24 left-0 right-0 z-20">
      {/* Navigation Container */}
      <div className="relative w-full flex justify-center">
        <div className="flex items-center justify-between w-full px-3">
          {/* Menu Icon */}
          <button className="w-8 h-8 flex items-center justify-center text-black hover:text-black/80">
            <span className="text-xl font-bold">☰</span>
          </button>

          {/* Categories */}
          <div className="flex space-x-0.5 overflow-x-auto scrollbar-hide items-center max-w-[280px] bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-1">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category)}
                className={`px-1.5 py-1 text-[6px] font-medium rounded-full whitespace-nowrap transition-colors
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
          <button className="w-8 h-8 flex items-center justify-center text-black hover:text-black/80">
            <Mail size={24} strokeWidth={2.5} className="transform transition-transform duration-300 hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
} 