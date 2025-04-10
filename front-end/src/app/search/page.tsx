'use client';

import { useState } from 'react';
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
            <div className="relative">
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
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.name}
                className="px-4 py-1 bg-[#424242] rounded-full text-xs text-white/90 whitespace-nowrap"
              >
                {category.name}
              </button>
            ))}
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
              className="aspect-square rounded-xl p-3 flex flex-col justify-end"
              style={{ backgroundColor: result.color }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={result.avatar}
                  alt={result.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[8px] font-semibold leading-tight truncate">{result.name}</h3>
                  <button className="bg-white/20 hover:bg-white/30 rounded-full px-2 py-0.5 text-[8px] font-medium transition-colors w-12">
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