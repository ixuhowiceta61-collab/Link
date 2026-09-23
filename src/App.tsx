import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Play,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Settings,
  Tv,
  QrCode as QrIcon,
  Sparkles,
  RefreshCw,
  X,
  Volume2,
  ShieldCheck,
  Film,
  Moon,
  Sun,
  Globe,
  ArrowRight,
  Clock,
  Flame,
  Download,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import { parseVideoUrl, SAMPLE_VIDEOS } from './utils/videoHelper.ts';
import { InPagePlayer } from './components/InPagePlayer.tsx';
import uploadedThumbnail from './assets/images/thumbnail_uploaded_1790149448086.jpg';

type Language = 'bn' | 'en';
type Theme = 'light' | 'dark';

const TARGET_DEFAULT_URL =
  'https://www.profitableratecpmnetwork.com/h5can1a6kf?key=1f487ec4c12509fbc3ca2b1632129777';

export default function App() {
  // Read initial query params if present
  const queryParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);

  const defaultUrlParam = queryParams.get('url') || TARGET_DEFAULT_URL;
  const defaultTitleParam = queryParams.get('title') || '';
  const defaultBtnParam = queryParams.get('btn') || '';
  const defaultLangParam = (queryParams.get('lang') as Language) || 'bn';

  // Core state - default theme 'dark' matching the user's styling (#0b0e14)
  const [lang, setLang] = useState<Language>(defaultLangParam);
  const [theme, setTheme] = useState<Theme>('dark');
  const [videoUrl, setVideoUrl] = useState<string>(defaultUrlParam);
  const [inputUrl, setInputUrl] = useState<string>(defaultUrlParam);
  const [titleText, setTitleText] = useState<string>(
    defaultTitleParam ||
      (defaultLangParam === 'bn'
        ? 'ভিডিওটি দেখতে নিচের বাটনে ক্লিক করুন'
        : 'Click the button below to watch the video')
  );
  const [btnText, setBtnText] = useState<string>(
    defaultBtnParam || (defaultLangParam === 'bn' ? 'এখনই ভিডিও দেখুন' : 'Watch Video Now')
  );

  // Functional UI state & Persistent Owner Stats (localStorage)
  const [clickCount, setClickCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('videohub_watch_clicks');
      return saved !== null ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [sessionClicks, setSessionClicks] = useState<number>(0);
  const [lastClickedAt, setLastClickedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('videohub_last_clicked_at');
    } catch {
      return null;
    }
  });
  const [showStatsView, setShowStatsView] = useState<boolean>(() => {
    try {
      return localStorage.getItem('videohub_show_stats') === 'true';
    } catch {
      return false;
    }
  });

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);
  const [showInPagePlayer, setShowInPagePlayer] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [autoRedirect, setAutoRedirect] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const countdownIntervalRef = useRef<number | null>(null);

  // Parsed video details
  const videoInfo = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  // Sync theme to root class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Generate QR Code whenever videoUrl or current share link updates
  const shareableUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams();
    params.set('url', videoUrl);
    if (titleText) params.set('title', titleText);
    if (btnText) params.set('btn', btnText);
    params.set('lang', lang);
    return `${base}?${params.toString()}`;
  }, [videoUrl, titleText, btnText, lang]);

  useEffect(() => {
    if (shareableUrl) {
      QRCode.toDataURL(shareableUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#161b22',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [shareableUrl]);

  // Handle countdown if user enables auto-redirect
  useEffect(() => {
    if (autoRedirect && timerActive && countdown > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleDirectWatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [autoRedirect, timerActive, countdown]);

  // Handle Watch Now click with persistent counting in LocalStorage
  const handleDirectWatch = () => {
    const nextCount = clickCount + 1;
    const now = new Date().toISOString();
    setClickCount(nextCount);
    setSessionClicks((prev) => prev + 1);
    setLastClickedAt(now);
    try {
      localStorage.setItem('videohub_watch_clicks', String(nextCount));
      localStorage.setItem('videohub_last_clicked_at', now);
    } catch (err) {
      console.error('LocalStorage write error', err);
    }

    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Toggle owner stats view and persist preference
  const toggleStatsView = () => {
    setShowStatsView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('videohub_show_stats', String(next));
      } catch {}
      return next;
    });
  };

  // Reset clicks counter with confirmation
  const handleResetClicks = () => {
    const confirmMsg =
      lang === 'bn'
        ? 'আপনি কি সমস্ত ক্লিক পরিসংখ্যান রিসেট করতে চান?'
        : 'Are you sure you want to reset all click statistics?';
    if (window.confirm(confirmMsg)) {
      setClickCount(0);
      setSessionClicks(0);
      setLastClickedAt(null);
      try {
        localStorage.setItem('videohub_watch_clicks', '0');
        localStorage.removeItem('videohub_last_clicked_at');
      } catch {}
    }
  };

  // Format click timestamp nicely
  const formatClickTime = (isoString: string | null, l: Language): string => {
    if (!isoString) return l === 'bn' ? 'এখনো কোনো ক্লিক নেই' : 'No clicks yet';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(l === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Copy Link to clipboard
  const handleCopyLink = (textToCopy: string, isShare: boolean = false) => {
    navigator.clipboard.writeText(textToCopy);
    if (isShare) {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2000);
    } else {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Switch language
  const toggleLanguage = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    if (nextLang === 'bn') {
      setTitleText('ভিডিওটি দেখতে নিচের বাটনে ক্লিক করুন');
      setBtnText('এখনই ভিডিও দেখুন');
    } else {
      setTitleText('Click the button below to watch the video');
      setBtnText('Watch Video Now');
    }
  };

  // Content labels based on language
  const t = {
    brand: lang === 'bn' ? 'ভিডিও হাব' : 'VideoHub',
    navHome: lang === 'bn' ? 'প্রধান পাতা' : 'Home',
    navChangeLink: lang === 'bn' ? 'লিংক পরিবর্তন' : 'Change Link',
    navQr: lang === 'bn' ? 'কিউআর কোড' : 'QR Code',
    navPreview: lang === 'bn' ? 'প্লেয়ার মোড' : 'Player View',
    verified:
      lang === 'bn'
        ? `নিরাপদ ভিডিও লিংক • ${videoInfo.platformName || 'YouTube'}`
        : `Safe Video Link • ${videoInfo.platformName || 'YouTube'}`,
    watchNow: btnText,
    inPageBtn: lang === 'bn' ? 'পেজের ভেতরে দেখুন' : 'Watch In-Page',
    copyBtn: lang === 'bn' ? 'লিংক কপি' : 'Copy Link',
    copiedBtn: lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
    shareBtn: lang === 'bn' ? 'শেয়ার করুন' : 'Share Link',
    clicks: lang === 'bn' ? 'বার দেখা হয়েছে' : 'views',
    customLinkHeading: lang === 'bn' ? 'আপনার ভিডিও লিংক যুক্ত করুন' : 'Custom Video Link Settings',
    pastePlaceholder:
      lang === 'bn'
        ? 'এখানে যেকোনো ভিডিও লিংক বা সিপিএম লিংক পেস্ট করুন...'
        : 'Paste any video URL or destination link...',
    applyBtn: lang === 'bn' ? 'লিংক আপডেট করুন' : 'Update Video Link',
    samplesHeading: lang === 'bn' ? 'নমুনা লিংক থেকে বেছে নিন:' : 'Or pick from curated presets:',
    qrHeading: lang === 'bn' ? 'মোবাইলে দেখতে স্ক্যান করুন' : 'Scan to Watch on Mobile',
    qrSub:
      lang === 'bn'
        ? 'আপনার ক্যামেরা দিয়ে কিউআর কোডটি স্ক্যান করে যেকোনো ডিভাইসে ভিডিও ল্যান্ডিং পেজটি খুলুন।'
        : 'Scan this QR code with any smartphone camera to open this video landing page instantly.',
    shareLinkText: lang === 'bn' ? 'শেয়ার লিঙ্ক কপি করুন' : 'Copy Shareable Link',
    footerText:
      lang === 'bn'
        ? '© 2026 ভিডিও হাব • রেসপন্সিভ ভিডিও ল্যান্ডিং ওয়েবসাইট'
        : '© 2026 VideoHub • Responsive Video Landing Website',
    autoRedirectLabel: lang === 'bn' ? 'স্বয়ংক্রিয় কাউন্টডাউন' : 'Auto Countdown',
    timerNotice: lang === 'bn' ? 'সেকেন্ড পর স্বয়ংক্রিয়ভাবে ভিডিও চালু হবে...' : 'seconds remaining until auto-open...',
    cancelTimer: lang === 'bn' ? 'বাতিল' : 'Cancel',
  };

  // Determine which preview image to display: prioritizing user uploaded thumbnail
  const displayThumbnail: string = uploadedThumbnail || videoInfo.thumbnailUrl || '';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0b0e14] text-[#f0f6fc]' : 'bg-[#f4f4f9] text-slate-800'
      }`}
    >
      {/* Top Bar Navigation (Frontend Design Top Bar Contract) */}
      <header
        className={`w-full border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
          theme === 'dark'
            ? 'border-[#2d333b] bg-[#161b22]/90'
            : 'border-slate-200 bg-white/90'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setShowInPagePlayer(false);
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white group"
          >
            <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Play className="w-3.5 h-3.5 fill-white" />
            </span>
            <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
              {t.brand}
            </span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
            <button
              onClick={() => setShowInPagePlayer(false)}
              className={`hover:text-red-500 transition-colors ${
                !showInPagePlayer ? 'text-red-500 font-semibold' : ''
              }`}
            >
              {t.navHome}
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="hover:text-red-500 transition-colors"
            >
              {t.navChangeLink}
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="hover:text-red-500 transition-colors"
            >
              {t.navQr}
            </button>
            <button
              onClick={() => setShowInPagePlayer(true)}
              className={`hover:text-red-500 transition-colors ${
                showInPagePlayer ? 'text-red-500 font-semibold' : ''
              }`}
            >
              {t.navPreview}
            </button>
            <button
              onClick={toggleStatsView}
              className={`hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer ${
                showStatsView ? 'text-red-500 font-semibold' : ''
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পরিসংখ্যান' : 'Owner Stats'}</span>
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Owner Stats Toggle Button */}
            <button
              onClick={toggleStatsView}
              title={lang === 'bn' ? 'মালিকের পরিসংখ্যান দেখুন' : 'Toggle Owner Stats'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                showStatsView
                  ? 'border-red-500/60 bg-red-600/20 text-red-400 shadow-sm shadow-red-900/40'
                  : theme === 'dark'
                  ? 'border-[#30363d] bg-[#21262d] text-slate-300 hover:bg-[#30363d]'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">
                {lang === 'bn' ? 'পরিসংখ্যান' : 'Stats'}
              </span>
              <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                {clickCount}
              </span>
            </button>

            {/* Language switch */}
            <button
              onClick={toggleLanguage}
              title="Toggle Language"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                theme === 'dark'
                  ? 'border-[#30363d] bg-[#21262d] text-slate-300 hover:bg-[#30363d]'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3 h-3 text-slate-400" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Dark / Light switch */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle Theme"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'text-slate-400 hover:bg-[#21262d] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                theme === 'dark'
                  ? 'bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
        {!showInPagePlayer ? (
          /* The Exact Dark Luxury Card requested by the user */
          <div className="w-full flex flex-col items-center">
            {/* Auto countdown banner if enabled */}
            {autoRedirect && timerActive && (
              <div className="w-full max-w-[420px] mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs animate-pulse text-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    <strong>{countdown}</strong> {t.timerNotice}
                  </span>
                </div>
                <button
                  onClick={() => setTimerActive(false)}
                  className="px-2 py-0.5 font-semibold bg-[#21262d] text-amber-300 border border-amber-700/60 rounded hover:bg-[#30363d]"
                >
                  {t.cancelTimer}
                </button>
              </div>
            )}

            {/* Small Toggleable Stats View for Landing Page Owner */}
            {showStatsView && (
              <div
                className={`w-full max-w-[420px] mb-4 p-4 rounded-[16px] transition-all duration-200 animate-fade-in shadow-xl ${
                  theme === 'dark'
                    ? 'bg-[#161b22] border border-[#30363d] text-[#f0f6fc]'
                    : 'bg-white border border-slate-200 text-slate-900 shadow-slate-200'
                }`}
              >
                {/* Stats Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#2d333b]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{lang === 'bn' ? 'মালিক পরিসংখ্যান' : 'Owner Stats'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">
                        {lang === 'bn' ? 'ব্রাউজার লোকাল স্টোরেজে সংরক্ষিত' : 'Persisted in Local Storage'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStatsView(false)}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
                    title={lang === 'bn' ? 'লুকান' : 'Hide'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div
                    className={`p-3 rounded-xl border text-left ${
                      theme === 'dark'
                        ? 'bg-[#0b0e14] border-[#21262d]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] text-[#8b949e] block mb-0.5">
                      {lang === 'bn' ? "'Watch Now' ক্লিক" : "'Watch Now' Clicks"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-red-500">
                        {clickCount}
                      </span>
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border text-left ${
                      theme === 'dark'
                        ? 'bg-[#0b0e14] border-[#21262d]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] text-[#8b949e] block mb-0.5">
                      {lang === 'bn' ? 'বর্তমান সেশনে' : 'This Session'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-emerald-400">
                        +{sessionClicks}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        {lang === 'bn' ? 'ক্লিক' : 'clicks'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Click Info */}
                <div
                  className={`p-2.5 rounded-lg border mb-3 text-[11px] flex items-center justify-between ${
                    theme === 'dark'
                      ? 'bg-[#0d1117] border-[#21262d] text-[#8b949e]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {lang === 'bn' ? 'সর্বশেষ ক্লিক:' : 'Last Click:'}
                  </span>
                  <span className="font-mono text-slate-300">
                    {formatClickTime(lastClickedAt, lang)}
                  </span>
                </div>

                {/* Footer Controls: Reset & Quick Test */}
                <div className="flex items-center justify-between pt-1 border-t border-[#2d333b]/60 text-xs">
                  <button
                    onClick={handleResetClicks}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title={lang === 'bn' ? 'ক্লিক সংখ্যা ০ করুন' : 'Reset count to 0'}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'কাউন্টার রিসেট' : 'Reset Counter'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = clickCount + 1;
                      const now = new Date().toISOString();
                      setClickCount(next);
                      setSessionClicks((prev) => prev + 1);
                      setLastClickedAt(now);
                      try {
                        localStorage.setItem('videohub_watch_clicks', String(next));
                        localStorage.setItem('videohub_last_clicked_at', now);
                      } catch {}
                    }}
                    className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#21262d] hover:bg-[#30363d] text-slate-200 border-[#30363d]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>+1 {lang === 'bn' ? 'টেস্ট ক্লিক' : 'Test Click'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* The Main Video Card */}
            <div
              className={`w-full max-w-[420px] rounded-[16px] p-5 text-center transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-[#161b22] border border-[#2d333b] shadow-[0_12px_35px_rgba(0,0,0,0.6)]'
                  : 'bg-white border border-slate-200 shadow-[0_12px_35px_rgba(0,0,0,0.1)]'
              }`}
            >
              {/* 1. সেফটি স্ট্যাটাস (Header Status) */}
              <div className="flex items-center justify-center gap-1.5 text-[#3fb950] text-[13px] font-medium mb-[15px]">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.verified}</span>
                {clickCount > 0 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <button
                      onClick={toggleStatsView}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-mono cursor-pointer transition-colors"
                      title={lang === 'bn' ? 'মালিক পরিসংখ্যান টগল করুন' : 'Toggle Owner Stats'}
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {clickCount} {t.clicks}
                    </button>
                  </>
                )}
              </div>

              {/* 2. আপলোড করা ছবি ব্যবহার করে থাম্বনেইল (Thumbnail Box with glowing play overlay) */}
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDirectWatch}
                className="relative block w-full rounded-[12px] overflow-hidden mb-[18px] cursor-pointer bg-black group shadow-md"
                title={lang === 'bn' ? 'ভিডিও দেখতে ক্লিক করুন' : 'Click to watch video'}
              >
                <img
                  src={displayThumbnail}
                  alt="Video Thumbnail"
                  className="w-full h-[240px] object-cover block opacity-90 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-102 transform transition-transform"
                />
                {/* Play overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[rgba(255,0,0,0.9)] group-hover:bg-[#ff0000] w-[60px] h-[60px] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,0,0,0.6)] group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </div>
              </a>

              {/* 3. টাইটেল */}
              <div
                className={`text-[18px] font-semibold mb-[18px] leading-[1.4] ${
                  theme === 'dark' ? 'text-[#f0f6fc]' : 'text-slate-900'
                }`}
              >
                {titleText}
              </div>

              {/* 4. মূল ভিডিও ডিরেক্ট লিংক বাটন (Red Gradient Main Button) */}
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDirectWatch}
                className="flex items-center justify-center gap-2.5 bg-gradient-to-br from-[#ff0000] to-[#cc0000] hover:from-[#ff1a1a] hover:to-[#b30000] text-white text-[17px] font-bold p-[14px] rounded-[10px] w-full shadow-[0_4px_15px_rgba(255,0,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,0,0,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mb-[15px] cursor-pointer text-center no-underline"
              >
                <Play className="w-5 h-5 fill-white shrink-0" />
                <span>{t.watchNow}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0 text-[13px]" />
              </a>

              {/* 5. অন্যান্য বাটন (Action Grid) */}
              <div className="grid grid-cols-2 gap-[10px] mb-[12px]">
                {/* পেজের ভেতরে দেখুন */}
                <button
                  onClick={() => setShowInPagePlayer(true)}
                  className={`p-[10px] rounded-[8px] text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium border ${
                    theme === 'dark'
                      ? 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>{t.inPageBtn}</span>
                </button>

                {/* লিংক কপি */}
                <button
                  onClick={() => handleCopyLink(videoUrl)}
                  className={`p-[10px] rounded-[8px] text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium border ${
                    theme === 'dark'
                      ? 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{t.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>{t.copyBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* শেয়ার করুন বাটন (Full width sub-btn) */}
              <button
                onClick={() => setShowQrModal(true)}
                className={`w-full p-[10px] rounded-[8px] text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-medium border ${
                  theme === 'dark'
                    ? 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>{t.shareBtn}</span>
              </button>

              {/* ইউআরএল প্রিভিউ বক্স with subtle pulse animation feedback */}
              <div
                onClick={() => handleCopyLink(videoUrl)}
                className={`p-2 rounded-[6px] text-[11px] break-all mt-[10px] font-mono cursor-pointer transition-all duration-300 flex items-center justify-between gap-2 select-all ${
                  isCopied
                    ? 'bg-emerald-950/40 border border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse ring-1 ring-emerald-500/50 scale-[1.01]'
                    : 'bg-[#0d1117] border border-[#21262d] text-[#8b949e] hover:border-[#30363d]'
                }`}
                title={
                  lang === 'bn'
                    ? isCopied
                      ? 'কপি সফল হয়েছে!'
                      : 'কপি করতে ক্লিক করুন'
                    : isCopied
                    ? 'Copied to clipboard!'
                    : 'Click to copy URL'
                }
              >
                <span className="truncate text-left flex items-center gap-1.5">
                  {isCopied && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline" />
                  )}
                  <span>URL: {videoUrl}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {isCopied ? (
                    <span className="text-[10px] text-emerald-400 font-sans font-medium px-1.5 py-0.2 rounded bg-emerald-500/20">
                      {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0 opacity-60 hover:opacity-100 text-slate-400" />
                  )}
                </span>
              </div>
            </div>

            {/* ফুটার */}
            <div className="mt-[15px] text-[12px] text-[#8b949e] font-sans text-center">
              <div>{t.footerText}</div>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <button
                  onClick={toggleStatsView}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title={lang === 'bn' ? 'মালিক পরিসংখ্যান টগল করুন' : 'Toggle Owner Stats'}
                >
                  <BarChart3 className="w-3 h-3 text-red-500" />
                  <span>
                    {showStatsView
                      ? lang === 'bn'
                        ? 'পরিসংখ্যান লুকান'
                        : 'Hide Owner Stats'
                      : lang === 'bn'
                      ? `মালিক পরিসংখ্যান (${clickCount})`
                      : `Owner Stats (${clickCount})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* In-Page Video Player with Visual Progress Indicator */
          <InPagePlayer
            videoUrl={videoUrl}
            videoInfo={videoInfo}
            titleText={titleText}
            lang={lang}
            onClose={() => setShowInPagePlayer(false)}
            onCopyLink={(url) => handleCopyLink(url)}
            isCopied={isCopied}
          />
        )}
      </main>

      {/* MODAL 1: Customize Video Link & Title */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#2d333b] text-white relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">
                {t.customLinkHeading}
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              {/* URL Input */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'ভিডিও লিংক (URL)' : 'Target Video URL'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder={t.pastePlaceholder}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#30363d] bg-[#0b0e14] text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      if (inputUrl.trim()) {
                        setVideoUrl(inputUrl.trim());
                      }
                    }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'সেট করুন' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'হেডিং / শিরোনাম' : 'Page Title'}
                </label>
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#30363d] bg-[#0b0e14] text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Button text Input */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'বাটন লেখা' : 'Button Label'}
                </label>
                <input
                  type="text"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#30363d] bg-[#0b0e14] text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Auto-redirect toggle */}
              <div className="pt-2 border-t border-[#30363d] flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200">
                    {t.autoRedirectLabel} (5s)
                  </span>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn'
                      ? 'ভিজিটর পেজে ঢুকলে ৫ সেকেন্ডের কাউন্টডাউন শুরু হবে'
                      : 'Visitors will see a 5-second countdown timer to auto-watch'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !autoRedirect;
                    setAutoRedirect(next);
                    setTimerActive(next);
                    setCountdown(5);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    autoRedirect ? 'bg-red-600' : 'bg-[#21262d] border border-[#30363d]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoRedirect ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Curated Sample Videos for quick test */}
              <div className="pt-2 border-t border-[#30363d]">
                <span className="block font-medium text-slate-300 mb-2 text-xs">
                  {t.samplesHeading}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_VIDEOS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        setInputUrl(sample.url);
                        setVideoUrl(sample.url);
                        setTitleText(lang === 'bn' ? sample.titleBn : sample.titleEn);
                      }}
                      className="text-left p-2.5 rounded-xl border border-[#30363d] hover:border-red-500 bg-[#0b0e14]/60 transition-colors"
                    >
                      <div className="text-xs font-semibold text-white truncate">
                        {lang === 'bn' ? sample.titleBn : sample.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {sample.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-white text-slate-950 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Share & QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#2d333b] text-center text-white relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 text-red-500 flex items-center justify-center mx-auto mb-3">
              <QrIcon className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              {t.qrHeading}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.qrSub}
            </p>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm inline-block mx-auto mb-4">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Copy Shareable URL button */}
            <button
              onClick={() => handleCopyLink(shareableUrl, true)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-xs sm:text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
            >
              {isShareCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t.shareLinkText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
