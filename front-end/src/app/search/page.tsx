'use client';

import { useState, useEffect, useRef } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import Link from 'next/link';

const categories = [
  { name: 'Breaking', color: '#424242' },
  { name: 'Following', color: '#424242' },
  { name: 'Politics', color: '#424242' },
  { name: 'Tech', color: '#424242' },
  { name: 'Business', color: '#424242' }
];

const searchResults = [
  {
    id: 1,
    name: 'Daily Mail+',
    handle: '@dailymail',
    color: '#FF0000',
    avatar: 'https://picsum.photos/seed/dailymail/100/100'
  },
  {
    id: 2,
    name: 'News+',
    handle: '@news',
    color: '#0066FF',
    avatar: 'https://picsum.photos/seed/news/100/100'
  },
  {
    id: 3,
    name: 'Tech News+',
    handle: '@technews',
    color: '#00FFFF',
    avatar: 'https://picsum.photos/seed/tech/100/100'
  },
  {
    id: 4,
    name: 'Daily Mail Sport+',
    handle: '@dailymailsport',
    color: '#00FF00',
    avatar: 'https://picsum.photos/seed/sport/100/100'
  },
  {
    id: 5,
    name: 'TechTalks+',
    handle: '@techtalks',
    color: '#00CCCC',
    avatar: 'https://picsum.photos/seed/talks/100/100'
  },
  {
    id: 6,
    name: 'TED Talks+',
    handle: '@tedtalks',
    color: '#FF0000',
    avatar: 'https://picsum.photos/seed/ted/100/100'
  },
  {
    id: 7,
    name: 'Khaleej+',
    handle: '@khaleej',
    color: '#FFFF00',
    avatar: 'https://picsum.photos/seed/khaleej/100/100'
  },
  {
    id: 8,
    name: 'BBC News+',
    handle: '@bbcnews',
    color: '#FF0000',
    avatar: 'https://picsum.photos/seed/bbc/100/100'
  },
  {
    id: 9,
    name: 'AI Today+',
    handle: '@aitoday',
    color: '#9933FF',
    avatar: 'https://picsum.photos/seed/aitoday/100/100'
  },
  {
    id: 10,
    name: 'Future Tech+',
    handle: '@futuretech',
    color: '#FF3366',
    avatar: 'https://picsum.photos/seed/future/100/100'
  },
  {
    id: 11,
    name: 'Science Daily+',
    handle: '@sciencedaily',
    color: '#33CC33',
    avatar: 'https://picsum.photos/seed/science/100/100'
  },
  {
    id: 12,
    name: 'AI Research+',
    handle: '@airesearch',
    color: '#FF9900',
    avatar: 'https://picsum.photos/seed/research/100/100'
  },
  {
    id: 13,
    name: 'Tech Insider+',
    handle: '@techinsider',
    color: '#00CCFF',
    avatar: 'https://picsum.photos/seed/insider/100/100'
  },
  {
    id: 14,
    name: 'Digital Trends+',
    handle: '@digitaltrends',
    color: '#CC00FF',
    avatar: 'https://picsum.photos/seed/digital/100/100'
  },
  {
    id: 15,
    name: 'AI Weekly+',
    handle: '@aiweekly',
    color: '#FF6600',
    avatar: 'https://picsum.photos/seed/weekly/100/100'
  },
  {
    id: 16,
    name: 'Robot News+',
    handle: '@robotnews',
    color: '#3366FF',
    avatar: 'https://picsum.photos/seed/robot/100/100'
  },
  {
    id: 17,
    name: 'ML Today+',
    handle: '@mltoday',
    color: '#FF33CC',
    avatar: 'https://picsum.photos/seed/ml/100/100'
  },
  {
    id: 18,
    name: 'Data Science+',
    handle: '@datascience',
    color: '#33FFCC',
    avatar: 'https://picsum.photos/seed/data/100/100'
  }
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Filter results based on search query
  const filteredResults = searchResults.filter(result => 
    result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when typing
  useEffect(() => {
    setShowDropdown(searchQuery.length > 0);
  }, [searchQuery]);

  // Handle touch events for swipeable categories
  const handleMouseDown = (e: React.MouseEvent) => {
    if (categoriesRef.current) {
      setIsDragging(true);
      setStartX(e.clientX);
      setScrollLeft(categoriesRef.current.scrollLeft);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (categoriesRef.current) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setScrollLeft(categoriesRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    const x = e.touches[0].clientX;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black">
        {/* Back button and search */}
        <div className="flex items-center gap-3 p-4">
          <Link href="/foryou" className="text-white/90 hover:text-white">
            <span className="text-lg">←</span>
          </Link>
          <div className="flex-1">
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#424242] rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/50 focus:outline-none"
                placeholder="Search for videos here"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                🔍
              </span>
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#424242] rounded-xl overflow-hidden shadow-lg max-h-[300px] overflow-y-auto scrollbar-hide">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <Link 
                        href={`/profile/${result.handle}`} 
                        key={result.id}
                        className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors"
                      >
                        <img
                          src={result.avatar}
                          alt={result.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex flex-col">
                          <h3 className="text-sm font-medium">{result.name}</h3>
                          <p className="text-xs text-white/70">{result.handle}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-white/70">
                      No results found (｡•́︿•̀｡)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col items-center w-full">
          <div className="w-4/5">
            <div 
              ref={categoriesRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="flex overflow-x-auto scrollbar-hide py-1"
            >
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`whitespace-nowrap text-sm px-3 py-1 rounded-full mr-2 ${
                    selectedCategory === category.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-2 pb-28 overflow-y-auto scrollbar-hide">
        {/* Spacing div */}
        <div className="h-[132px]" />
        <h2 className="text-sm mb-4 text-center">Results for ...</h2>
        <div className="grid grid-cols-3 gap-2">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="aspect-square rounded-xl p-3 flex flex-col justify-end relative overflow-hidden"
              style={{ backgroundColor: result.color }}
            >
              {/* Black gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
              
              <div className="flex items-center gap-1 relative z-10">
                <Link 
                  href={`/@${result.handle.replace('@', '')}`}
                  className="hover:opacity-90 transition-opacity"
                >
                  <img
                    src={result.avatar}
                    alt={result.name}
                    className="w-8 h-8 rounded-full"
                  />
                </Link>
                <div className="flex flex-col gap-0.5">
                  <Link 
                    href={`/@${result.handle.replace('@', '')}`}
                    className="hover:opacity-90 transition-opacity"
                  >
                    <h3 className="text-[6px] font-semibold leading-tight truncate">{result.name}</h3>
                  </Link>
                  <button className="bg-white/20 hover:bg-white/30 rounded-full px-1.5 py-0.5 text-[6px] font-medium transition-colors w-10 border-2 border-blue-300">
                    Follow
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="z-10">
        <BottomNav />
      </div>
    </main>
  );
} 