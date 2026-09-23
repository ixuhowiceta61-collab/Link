import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ExternalLink,
  X,
  Copy,
  Check,
  Clock,
  Gauge,
  Film,
  Sparkles,
  Info,
} from 'lucide-react';
import { VideoInfo } from '../utils/videoHelper.ts';

interface InPagePlayerProps {
  videoUrl: string;
  videoInfo: VideoInfo;
  titleText: string;
  lang: 'bn' | 'en';
  onClose: () => void;
  onCopyLink: (url: string) => void;
  isCopied: boolean;
}

// Utility to format seconds into MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');

  if (h > 0) {
    const hStr = String(h).padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

export function InPagePlayer({
  videoUrl,
  videoInfo,
  titleText,
  lang,
  onClose,
  onCopyLink,
  isCopied,
}: InPagePlayerProps) {
  // Video element ref for HTML5 direct playback
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(240); // default 4 minutes placeholder for streams
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  // Hover scrubber preview tooltip
  const [isHoveringProgress, setIsHoveringProgress] = useState<boolean>(false);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [hoverTime, setHoverTime] = useState<number>(0);

  // Session elapsed watch timer for embeds
  const [sessionWatchTime, setSessionWatchTime] = useState<number>(0);

  const isDirectVideo = videoInfo.type === 'direct';

  // Format bilingual labels
  const t = {
    backToLanding: lang === 'bn' ? 'ল্যান্ডিং পেজে ফিরুন' : 'Back to Landing',
    openExternal: lang === 'bn' ? 'সরাসরি ব্রাউজারে খুলুন' : 'Open in New Tab',
    copyLink: lang === 'bn' ? 'লিংক কপি' : 'Copy Link',
    copied: lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
    source: lang === 'bn' ? 'উৎস:' : 'Source:',
    playbackProgress: lang === 'bn' ? 'প্লেব্যাক প্রগ্রেস' : 'Playback Progress',
    elapsedTime: lang === 'bn' ? 'চলমান সময়:' : 'Current Time:',
    durationLabel: lang === 'bn' ? 'মোট সময়:' : 'Duration:',
    completed: lang === 'bn' ? 'সম্পন্ন' : 'completed',
    remaining: lang === 'bn' ? 'বাকি' : 'remaining',
    sessionWatch: lang === 'bn' ? 'মোট দেখার সময়:' : 'Session Watch Time:',
    playbackSpeed: lang === 'bn' ? 'গতি' : 'Speed',
    jumpBack: lang === 'bn' ? '১০ সেকেন্ড পেছনে' : '10s Back',
    jumpForward: lang === 'bn' ? '১০ সেকেন্ড সামনে' : '10s Forward',
    mute: lang === 'bn' ? 'মিউট' : 'Mute',
    unmute: lang === 'bn' ? 'আনমিউট' : 'Unmute',
    fullscreen: lang === 'bn' ? 'ফুলস্ক্রিন' : 'Fullscreen',
    exitFullscreen: lang === 'bn' ? 'সাধারণ স্ক্রিন' : 'Exit Fullscreen',
    trackingNotice:
      lang === 'bn'
        ? 'লাইভ টাইম ট্র্যাকার সক্রিয় - আপনি ভিডিওটি নিয়ন্ত্রণ ও প্রগ্রেস স্ক্রাব করতে পারেন'
        : 'Live time tracker active - scrub timeline and monitor playback',
  };

  // Direct HTML5 Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectVideo) return;

    const onLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [isDirectVideo, videoUrl]);

  // Session elapsed ticker & embed progress simulation if iframe
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setSessionWatchTime((prev) => prev + 1);

        // If not direct video, also smoothly advance the progress tracker
        if (!isDirectVideo) {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              return 0; // loop or hold
            }
            return prev + 1;
          });
        }
      }, 1000 / playbackRate);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isDirectVideo, duration, playbackRate]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isDirectVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  // Seek time on progress bar click or drag
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetPercent = clickX / rect.width;
    const newTime = targetPercent * duration;

    setCurrentTime(newTime);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Hover position calculation for tooltip
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = hoverX / rect.width;
    setHoverPosition(hoverX);
    setHoverTime(ratio * duration);
    setIsHoveringProgress(true);
  };

  // Jump by delta seconds (+/- 10s)
  const jumpTime = (delta: number) => {
    const nextTime = Math.max(0, Math.min(currentTime + delta, duration));
    setCurrentTime(nextTime);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      if (isDirectVideo && videoRef.current) videoRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (isDirectVideo && videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = newVol;
      }
    }
  };

  // Playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Percentage calculations
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, Math.max(0, (bufferedEnd / duration) * 100)) : 0;
  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-4xl mx-auto transition-all duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3">
              {isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
              {titleText}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.openExternal}</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-500/20"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.backToLanding}</span>
            </button>
          </div>
        </div>

        {/* Video Screen Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden">
          {videoInfo.type === 'youtube' && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              title="YouTube Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : videoInfo.type === 'vimeo' && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              title="Vimeo Player"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : isDirectVideo ? (
            <video
              ref={videoRef}
              src={videoInfo.embedUrl || videoUrl}
              autoPlay
              playsInline
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            >
              Your browser does not support HTML5 video.
            </video>
          ) : (
            /* Fallback generic video banner */
            <div className="p-8 text-center max-w-md text-white">
              <Film className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-80" />
              <h3 className="text-lg font-bold mb-2">
                {lang === 'bn' ? 'ভিডিওটি প্লে করার জন্য প্রস্তুত' : 'Video Ready to Watch'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {lang === 'bn'
                  ? 'এই সাইটটি সরাসরি ব্রাউজারে সুরক্ষিত মোডে খুলবে।'
                  : 'This video provider will open safely in your browser.'}
              </p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{lang === 'bn' ? '▶ এখনই দেখুন' : '▶ Watch Now'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Quick Play/Pause big overlay icon on hover for direct videos */}
          {isDirectVideo && (
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 hover:bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto backdrop-blur-xs"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-white" />
              ) : (
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              )}
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* VISUAL PROGRESS INDICATOR & PLAYBACK TIME TRACKER COMPONENT */}
        {/* ============================================================ */}
        <div className="bg-slate-900 border-t border-slate-800 text-white px-4 sm:px-6 py-3.5 space-y-2.5 select-none">
          {/* 1. Scrubbable Timeline Track with Buffer and Progress Bar */}
          <div className="relative pt-1 pb-1">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              onMouseMove={handleProgressMouseMove}
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => setIsHoveringProgress(false)}
              className="group/progress relative h-2 hover:h-3.5 w-full bg-slate-800 rounded-full cursor-pointer transition-all duration-150 flex items-center overflow-visible"
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-slate-800 rounded-full" />

              {/* Buffered progress bar (for direct videos) */}
              {bufferedPercent > 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-slate-600/70 rounded-full transition-all duration-200"
                  style={{ width: `${bufferedPercent}%` }}
                />
              )}

              {/* Active Elapsed Playback Progress Fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-100 relative shadow-sm shadow-red-500/50"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Glowing Thumb Handle */}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-150" />
              </div>

              {/* Hover Position Line and Floating Tooltip */}
              {isHoveringProgress && (
                <div
                  className="absolute -top-8 -translate-x-1/2 bg-slate-800 text-slate-100 text-[11px] font-mono tabular-nums px-2 py-0.5 rounded shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap z-20"
                  style={{ left: `${hoverPosition}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>
          </div>

          {/* 2. Control Row: Play/Pause, Seek Buttons, Progress Metrics, Speed & Fullscreen */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            {/* Left Controls: Play/Pause, -10s, +10s, Volume, Tabular Time */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause toggle */}
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-red-600/40"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                )}
              </button>

              {/* -10s Jump */}
              <button
                onClick={() => jumpTime(-10)}
                title={t.jumpBack}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* +10s Jump */}
              <button
                onClick={() => jumpTime(10)}
                title={t.jumpForward}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume Slider (Direct Video) */}
              {isDirectVideo && (
                <div className="hidden sm:flex items-center gap-1.5 pl-1 group">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1.5 accent-red-600 bg-slate-700 rounded-lg cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )}

              {/* Tabular Time Display (Current / Duration) */}
              <div className="flex items-center gap-1 font-mono tabular-nums text-xs text-slate-200 ml-1">
                <span className="font-semibold text-white">
                  {formatTime(currentTime)}
                </span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Completion Percentage Badge, Speed Selector, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Completed Percentage Badge */}
              <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-300 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60">
                <span className="text-red-400 font-bold">
                  {Math.round(progressPercent)}%
                </span>
                <span className="text-slate-400 text-[10px]">{t.completed}</span>
              </div>

              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1 z-30 flex flex-col min-w-[70px]">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`px-2.5 py-1 text-left text-xs font-mono rounded hover:bg-slate-700 transition-colors ${
                          playbackRate === rate ? 'text-red-400 font-bold bg-slate-700/50' : 'text-slate-300'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? t.exitFullscreen : t.fullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Detailed Playback Status Ribbon */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>
                {t.sessionWatch}{' '}
                <strong className="text-slate-200 font-mono tabular-nums">
                  {formatTime(sessionWatchTime)}
                </strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                {t.remaining}:{' '}
                <span className="font-mono tabular-nums text-slate-300">
                  -{formatTime(remainingTime)}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="hidden sm:inline text-[10px] text-slate-500">
                {t.trackingNotice}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info row */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <strong>{t.source}</strong> {videoInfo.platformName}
            </span>
            <span>·</span>
            <button
              onClick={() => onCopyLink(videoUrl)}
              className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{isCopied ? t.copied : t.copyLink}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            ← {t.backToLanding}
          </button>
        </div>
      </div>
    </div>
  );
}
