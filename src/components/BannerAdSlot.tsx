import React, { useState } from 'react';
import { Sparkles, ExternalLink, X } from 'lucide-react';

interface BannerAdSlotProps {
  position: 'top-sticky' | 'bottom-sticky' | 'inline' | 'sidebar';
  width?: number | string;
  height?: number | string;
  label?: string;
  className?: string;
  adsterraKey?: string;
  targetUrl?: string;
  lang?: 'bn' | 'en';
}

/**
 * BannerAdSlot provides a responsive, high-converting banner container.
 * It supports:
 * 1. Adsterra iframe/script code injection placeholder with comments
 * 2. Visual high-contrast ad styling that blends into dark/light themes
 * 3. Dismiss button for sticky banners (user friendly)
 * 4. Fallback direct link click-through to target CPM URL
 */
export const BannerAdSlot: React.FC<BannerAdSlotProps> = ({
  position,
  width = 320,
  height = 50,
  label,
  className = '',
  targetUrl = 'https://www.profitableratecpmnetwork.com/p4cytkzc0t?key=c4a7468d219e3c52d904db81d2cecb7b',
  lang = 'bn',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Sticky bottom banner container (matches requested fixed bottom container)
  if (position === 'bottom-sticky') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 999,
          textAlign: 'center',
          background: 'rgba(11, 14, 20, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
        className={`border-t border-[#30363d] py-1.5 px-3 flex flex-col items-center justify-center transition-all shadow-[0_-5px_20px_rgba(0,0,0,0.7)] ${className}`}
      >
        <div className="relative w-full max-w-[760px] flex items-center justify-center">
          {/* Ad Label & Close */}
          <div className="absolute -top-3 left-2 flex items-center gap-1 bg-[#161b22] px-2 py-0.5 rounded text-[9px] text-[#8b949e] border border-[#30363d] uppercase tracking-wider font-mono">
            <span>{label || (lang === 'bn' ? 'বিজ্ঞাপন' : 'Sponsored')}</span>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            aria-label="Close Ad"
            className="absolute -top-3 right-2 bg-[#21262d] hover:bg-[#30363d] text-slate-400 hover:text-white p-0.5 rounded-full border border-[#30363d] cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Adsterra 728x90 (Desktop) / 320x50 (Mobile) Banner Container */}
          <div className="w-full flex justify-center items-center overflow-hidden my-0.5">
            {/* 
              === Adsterra Script / iframe integration container ===
              To render real Adsterra Banner:
              1. Replace or supplement the link below with your invoke.js script or iframe:
                 <script type="text/javascript">
                   atOptions = {
                     'key' : 'YOUR_ADSTERRA_KEY',
                     'format' : 'iframe',
                     'height' : 50,
                     'width' : 320,
                     'params' : {}
                   };
                 </script>
                 <script type="text/javascript" src="//www.highperformanceformat.com/YOUR_ADSTERRA_KEY/invoke.js"></script>
            */}
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-between w-full max-w-[728px] h-[50px] sm:h-[60px] px-3 sm:px-5 rounded-lg bg-gradient-to-r from-red-950/70 via-[#1c2128] to-amber-950/70 border border-red-500/40 hover:border-red-400 transition-all hover:scale-[1.005] shadow-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3 text-left">
                <span className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                </span>
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-bold text-white group-hover:text-red-300 transition-colors truncate">
                    {lang === 'bn'
                      ? '⚡ প্রিমিয়াম স্ট্রিমিং ও দ্রুত বাফারিং উপভোগ করুন!'
                      : '⚡ Enjoy High-Speed HD Video & Fast Buffering!'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono hidden sm:block truncate">
                    728x90 / 320x50 CPM Banner Network · Click to start
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-transform group-hover:translate-x-0.5">
                <span>{lang === 'bn' ? 'ওপেন' : 'Open'}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Sticky top banner container
  if (position === 'top-sticky') {
    return (
      <div
        className={`w-full z-40 bg-[#0d1117]/95 border-b border-[#30363d] backdrop-blur-md py-1.5 px-3 flex items-center justify-center ${className}`}
      >
        <div className="relative w-full max-w-[760px] flex items-center justify-center">
          <div className="flex items-center justify-between w-full max-w-[728px] gap-2">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-between px-3 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-red-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-semibold shrink-0">
                  {lang === 'bn' ? 'বিজ্ঞাপন' : 'Ad'}
                </span>
                <span className="text-xs text-slate-200 font-medium truncate">
                  {lang === 'bn'
                    ? '🔥 আনলিমিটেড হাই-স্পিড ভিডিও স্ট্রিমিং ও ডাউনলোড লিংক'
                    : '🔥 Unlimited High-Speed Video Streaming & Direct Links'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-red-400 font-bold shrink-0 ml-2">
                <span>{lang === 'bn' ? 'দেখুন' : 'Watch'}</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>

            <button
              onClick={() => setIsVisible(false)}
              aria-label="Close Top Ad"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#21262d] cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar Ad slot (300x250 or 160x600 banner)
  if (position === 'sidebar') {
    return (
      <div
        className={`w-[160px] xl:w-[200px] hidden lg:flex flex-col items-center justify-start p-2 rounded-xl bg-[#161b22]/80 border border-[#30363d] shadow-lg sticky top-24 self-start ${className}`}
      >
        <div className="w-full flex items-center justify-between pb-1.5 mb-2 border-b border-[#30363d] text-[10px] text-slate-400 font-mono">
          <span>{lang === 'bn' ? 'বিজ্ঞাপন' : 'SPONSORED'}</span>
          <span className="text-[9px] opacity-70">Adsterra Slot</span>
        </div>

        {/* 
          === Adsterra Sidebar Script Container ===
          Replace with Adsterra 160x600 or 300x250 script code:
          <script type="text/javascript">
            atOptions = {
              'key' : 'YOUR_ADSTERRA_KEY',
              'format' : 'iframe',
              'height' : 250,
              'width' : 300,
              'params' : {}
            };
          </script>
        */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full h-[340px] rounded-lg border border-red-500/30 hover:border-red-400 bg-gradient-to-b from-red-950/40 via-[#0b0e14] to-red-950/60 p-3 flex flex-col justify-between items-center text-center transition-all hover:scale-[1.01]"
        >
          <div className="w-full">
            <span className="inline-block px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold mb-2">
              HD STREAM
            </span>
            <h4 className="text-xs font-semibold text-white group-hover:text-red-300 leading-tight">
              {lang === 'bn' ? 'সরাসরি ভিডিও প্লেয়ার শুরু করুন' : 'Direct High-Speed Video Player'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-2">
              {lang === 'bn' ? 'বাফারিং ছাড়া দেখুন' : 'Zero buffer 1080p'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-red-400" />
          </div>

          <div className="w-full py-2 bg-red-600 group-hover:bg-red-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1">
            <span>{lang === 'bn' ? 'ক্লিক করুন' : 'Click Here'}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>
      </div>
    );
  }

  // Default Inline Banner (728x90 / 320x50)
  return (
    <div
      style={{ textAlign: 'center', margin: '12px 0' }}
      className={`w-full max-w-[728px] mx-auto flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono px-1 mb-1">
        <span>{lang === 'bn' ? 'বিজ্ঞাপন' : 'SPONSORED'}</span>
        <span className="text-[9px]">728x90 / 320x50 Banner Slot</span>
      </div>

      {/* 
        === Adsterra Script / iframe integration container ===
        <script type="text/javascript">
          atOptions = {
            'key' : 'YOUR_ADSTERRA_KEY',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/YOUR_ADSTERRA_KEY/invoke.js"></script>
      */}
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-[60px] sm:h-[80px] rounded-xl border border-red-500/30 hover:border-red-400 bg-gradient-to-r from-[#161b22] via-red-950/30 to-[#161b22] px-4 flex items-center justify-between transition-all hover:scale-[1.008] shadow-md group"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white group-hover:text-red-300">
              {lang === 'bn'
                ? 'অনলাইন এইচডি ভিডিও কনটেন্ট প্ল্যাটফর্ম'
                : 'Online HD Video Streaming Experience'}
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {lang === 'bn'
                ? 'দ্রুত স্পিড ও বিজ্ঞাপন মুক্ত অপশন এক্সপ্লোর করতে ট্যাপ করুন'
                : 'Tap to explore fast streaming and high quality direct options'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold bg-red-600 group-hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0">
          <span>{lang === 'bn' ? 'ভিজিট' : 'Visit'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </a>
    </div>
  );
};

export default BannerAdSlot;
