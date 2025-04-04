'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <div className="absolute top-12 left-0 right-0 z-20">
      {/* Navigation Container */}
      <div className="relative px-1">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide justify-center">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category)}
              className={`px-1 py-0.5 text-[9px] font-medium rounded-full whitespace-nowrap transition-colors
                ${activeCategory === category.name
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:text-white'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 