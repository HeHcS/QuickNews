import React from 'react';

interface ArticlePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function ArticlePopup({ isOpen, onClose, title, content }: ArticlePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-[360px] tall-screen:w-[720px] h-screen max-h-screen bg-[#0A0A0A]/80 backdrop-blur-sm text-white overflow-y-auto scrollbar-hide">
        {/* Back button - stays fixed */}
        <button 
          onClick={onClose}
          className="fixed top-4 left-4 sm:left-4 z-50 flex items-center text-white/90 hover:text-white"
        >
          <span className="text-lg mr-2">←</span>
          <span className="text-sm">Back</span>
        </button>

        <div className="px-4 pt-16">
          {/* Title */}
          <h1 className="text-[28px] font-bold leading-tight mb-4">NATO on High Alert: Chief Warns of WWIII Risk as Putin's Threats Escalate</h1>

          {/* Source and date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src="https://picsum.photos/seed/dailymail/32/32"
                alt="Daily Mail"
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col justify-center">
                <span className="text-xs text-white/70">Daily Mail</span>
                <span className="text-[11px] text-white/50">@dailymail</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#FFB800]">Published on</span>
              <span className="text-xs text-[#FFB800]">12 November 2024</span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="w-full aspect-video bg-blue-600 mb-4">
            <img
              src="https://picsum.photos/seed/nato/800/450"
              alt="NATO Meeting"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="space-y-6 pb-24">
            {/* NATO's Unprecedented Warning */}
            <section>
              <h2 className="text-[22px] font-bold mb-2">NATO's Unprecedented Warning</h2>
              <p className="text-[13px] leading-relaxed text-white/80">
                NATO leadership has issued a grave warning to its member states, calling for immediate preparation for potential "wartime scenarios". This extraordinary alert comes as a direct response to heightened international tensions and concerning rhetoric about World War III.
              </p>
            </section>

            {/* Strategic Military Readiness */}
            <section>
              <h2 className="text-[22px] font-bold mb-2">Strategic Military Readiness</h2>
              <p className="text-[13px] leading-relaxed text-white/80">
                The alliance is intensifying its preparedness protocols, emphasizing the need for member nations to strengthen their defensive capabilities. This strategic shift reflects the organization's assessment of current global security risks and potential conflict scenarios.
              </p>
            </section>

            {/* Geopolitical Context */}
            <section>
              <h2 className="text-[22px] font-bold mb-2">Geopolitical Context</h2>
              <p className="text-[13px] leading-relaxed text-white/80">
                Putin's Escalating Rhetoric Recent statements from Russia have contributed to the mounting tension, prompting NATO to take these unprecedented measures. The situation marks a critical point in international relations, with military readiness becoming increasingly paramount.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 