import React, { useEffect, useState } from 'react';

// Helper function for responsive sizing based on viewport height
const getResponsiveSize = (baseSize: number): string => {
  // Convert base size to vh units (700px = 100vh reference)
  const vhSize = (baseSize / 700) * 100;
  // Only use vh units for responsive scaling, with a minimum size to prevent text from becoming too small
  return `max(${baseSize * 0.5}px, ${vhSize}vh)`;
};

interface ArticlePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function ArticlePopup({ isOpen, onClose, title, content }: ArticlePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // First set visible to true to render the component
      setIsVisible(true);
      setIsClosing(false);
      
      // Add a small delay before starting the animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to ensure the component is rendered first
      
      return () => clearTimeout(timer);
    } else if (isVisible) {
      // Start closing animation
      setIsAnimating(false);
      setIsClosing(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match this with the transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  const handleClose = () => {
    // Start closing animation
    setIsAnimating(false);
    setIsClosing(true);
    
    setTimeout(() => {
      onClose();
    }, 300); // Match this with the transition duration
  };

  // Enhanced placeholder content with more details
  const enhancedContent = content || `
In a groundbreaking development that has captured global attention, world leaders have reached a historic agreement on climate change at the latest UN summit. The groundbreaking deal includes ambitious targets for reducing global emissions and establishes a new framework for international cooperation.

The agreement, which was reached after intense negotiations lasting over two weeks, represents a significant shift in how nations approach environmental policy. "This is a turning point in our collective fight against climate change," said UN Secretary-General António Guterres during the closing ceremony. "For the first time, we have a comprehensive plan that brings together developed and developing nations in a shared commitment to protect our planet."

Key highlights of the agreement include:

• A 50% reduction in global emissions by 2030 compared to 2010 levels
• Establishment of a $100 billion climate fund to support developing nations
• Mandatory reporting of emission levels every two years
• Creation of a new international body to monitor compliance

Environmental experts have praised the agreement as "unprecedented" and "a beacon of hope" for future generations. Dr. Sarah Chen, a climate scientist at the International Climate Institute, noted that "while the targets are ambitious, they are achievable with the right combination of policy, technology, and public engagement."

The agreement has also received strong support from business leaders, with over 200 major corporations pledging to align their operations with the new targets. Tech giants, in particular, have announced significant investments in renewable energy and sustainable practices.

Public reaction has been overwhelmingly positive, with climate activists celebrating the agreement as a victory for environmental advocacy. Social media has been flooded with messages of hope and determination, with the hashtag #ClimateAction trending globally.

As nations begin the work of implementing these ambitious targets, attention now turns to the practical steps needed to achieve them. This will require unprecedented cooperation between governments, businesses, and citizens worldwide.

The next major climate summit is scheduled for 2025, where nations will report on their progress and potentially strengthen their commitments further.`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className={`relative w-auto h-screen max-h-screen aspect-[9/16] bg-[#0A0A0A]/80 backdrop-blur-sm text-white overflow-y-auto scrollbar-hide rounded-3xl transition-all duration-300 ${
          isAnimating ? 'translate-y-0 scale-100' : 'translate-y-full scale-95'
        }`}
      >
        {/* Back button - stays fixed */}
        <button 
          onClick={handleClose}
          className="fixed top-4 left-4 sm:left-4 z-50 flex items-center text-white/90 hover:text-white"
          style={{ padding: `${getResponsiveSize(4)} ${getResponsiveSize(8)}` }}
        >
          <span style={{ fontSize: getResponsiveSize(16), marginRight: getResponsiveSize(8) }}>←</span>
          <span style={{ fontSize: getResponsiveSize(12) }}>Back</span>
        </button>

        <div style={{ padding: `0 ${getResponsiveSize(16)}`, paddingTop: getResponsiveSize(64) }}>
          {/* Title */}
          <h1 style={{ fontSize: getResponsiveSize(28), marginBottom: getResponsiveSize(8) }} className="font-bold leading-tight">{title}</h1>
          
          {/* Subtitle */}
          <p style={{ fontSize: getResponsiveSize(16), marginBottom: getResponsiveSize(16), color: 'rgba(255, 255, 255, 0.7)' }} className="font-medium">
            A comprehensive look at the latest developments and what they mean for our future
          </p>

          {/* Source and date */}
          <div style={{ marginBottom: getResponsiveSize(16) }} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="https://picsum.photos/seed/dailymail/32/32"
                alt="Daily Mail"
                style={{ width: getResponsiveSize(32), height: getResponsiveSize(32) }}
                className="rounded-full"
              />
              <div className="flex flex-col justify-center">
                <span style={{ fontSize: getResponsiveSize(12) }} className="text-white/70">Daily Mail</span>
                <span style={{ fontSize: getResponsiveSize(11) }} className="text-white/50">@dailymail</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span style={{ fontSize: getResponsiveSize(12) }} className="text-[#FFB800]">Published on</span>
              <span style={{ fontSize: getResponsiveSize(12) }} className="text-[#FFB800]">12 November 2024</span>
            </div>
          </div>

          {/* Featured Image with Caption */}
          <div style={{ marginBottom: getResponsiveSize(16), position: 'relative' }} className="w-full aspect-video bg-blue-600">
            <img
              src="https://picsum.photos/seed/nato/800/450"
              alt="Article Featured Image"
              className="w-full h-full object-cover"
            />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              padding: getResponsiveSize(8),
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              fontSize: getResponsiveSize(10),
              color: 'rgba(255,255,255,0.7)',
              zIndex: 1
            }}>
              World leaders gather at the UN Climate Summit in New York, November 2024
            </div>
          </div>

          {/* Content */}
          <div style={{ paddingBottom: getResponsiveSize(96) }} className="space-y-6">
            {/* Main Article Content */}
            <section>
              <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6' }} className="leading-relaxed text-white/80 whitespace-pre-line">
                {enhancedContent}
              </p>
              
              {/* Additional content sections */}
              <div style={{ marginTop: getResponsiveSize(24) }}>
                <h2 style={{ fontSize: getResponsiveSize(18), marginBottom: getResponsiveSize(12), fontWeight: 'bold' }}>What This Means For You</h2>
                <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6', marginBottom: getResponsiveSize(12) }} className="text-white/80">
                  The implications of this agreement extend far beyond international politics. For individuals and communities, it signals a shift toward more sustainable living practices and increased investment in green technologies.
                </p>
                <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6' }} className="text-white/80">
                  Experts predict that this will lead to significant changes in how we consume energy, travel, and make purchasing decisions in the coming years. The transition to renewable energy sources is expected to accelerate, creating new job opportunities in the green technology sector.
                </p>
              </div>
              
              <div style={{ marginTop: getResponsiveSize(24) }}>
                <h2 style={{ fontSize: getResponsiveSize(18), marginBottom: getResponsiveSize(12), fontWeight: 'bold' }}>Expert Reactions</h2>
                <div style={{ 
                  padding: getResponsiveSize(12), 
                  borderLeft: `4px solid #29ABE2`, 
                  marginBottom: getResponsiveSize(16),
                  background: 'rgba(41, 171, 226, 0.1)'
                }}>
                  <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6', fontStyle: 'italic' }} className="text-white/90">
                    "This agreement represents a watershed moment in our collective response to climate change. The targets are ambitious but achievable, and the framework provides the structure needed for meaningful action."
                  </p>
                  <p style={{ fontSize: getResponsiveSize(12), marginTop: getResponsiveSize(8), fontWeight: 'bold' }} className="text-white/70">
                    — Dr. James Wilson, Climate Policy Institute
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: getResponsiveSize(24) }}>
                <h2 style={{ fontSize: getResponsiveSize(18), marginBottom: getResponsiveSize(12), fontWeight: 'bold' }}>Next Steps</h2>
                <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6', marginBottom: getResponsiveSize(12) }} className="text-white/80">
                  With the agreement now in place, attention turns to implementation. Each participating nation will need to develop detailed plans for meeting their emission reduction targets, which will likely involve a combination of policy changes, technological innovation, and public education campaigns.
                </p>
                <p style={{ fontSize: getResponsiveSize(13), lineHeight: '1.6' }} className="text-white/80">
                  The first progress report is scheduled for 2025, at which point nations will gather to assess their achievements and potentially strengthen their commitments further. This ongoing process of evaluation and adjustment will be crucial to the long-term success of the agreement.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 