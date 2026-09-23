/**
 * Video link parsing and utility functions
 */

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'generic';
  embedUrl: string | null;
  thumbnailUrl: string | null;
  platformName: string;
  originalUrl: string;
  duration: string;
}

export function getMockDuration(inputUrl: string): string {
  if (!inputUrl) return '14:28';
  let hash = 0;
  for (let i = 0; i < inputUrl.length; i++) {
    hash = (hash << 5) - hash + inputUrl.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const minutes = 4 + (positiveHash % 22);
  const seconds = positiveHash % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
}

export function parseVideoUrl(inputUrl: string): VideoInfo {
  const cleanUrl = inputUrl.trim();
  const sample = SAMPLE_VIDEOS.find((s) => s.url === cleanUrl);
  const mockDuration = sample?.duration || (cleanUrl ? getMockDuration(cleanUrl) : '14:28');

  if (!cleanUrl) {
    return {
      type: 'generic',
      embedUrl: null,
      thumbnailUrl: null,
      platformName: 'Link',
      originalUrl: '',
      duration: '14:28',
    };
  }

  // YouTube matchers
  // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = cleanUrl.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      platformName: 'YouTube',
      originalUrl: cleanUrl,
      duration: mockDuration,
    };
  }

  // Vimeo matchers
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i;
  const vimeoMatch = cleanUrl.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnailUrl: null,
      platformName: 'Vimeo',
      originalUrl: cleanUrl,
      duration: mockDuration,
    };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'direct',
      embedUrl: cleanUrl,
      thumbnailUrl: null,
      platformName: 'Direct Video',
      originalUrl: cleanUrl,
      duration: mockDuration,
    };
  }

  // Other domains
  let platformName = 'Website Video';
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname.includes('facebook') || parsed.hostname.includes('fb.watch')) {
      platformName = 'Facebook';
    } else if (parsed.hostname.includes('tiktok')) {
      platformName = 'TikTok';
    } else if (parsed.hostname.includes('instagram')) {
      platformName = 'Instagram';
    } else if (parsed.hostname.includes('drive.google.com')) {
      platformName = 'Google Drive';
    } else {
      platformName = parsed.hostname.replace(/^www\./, '');
    }
  } catch {
    // fallback
  }

  return {
    type: 'generic',
    embedUrl: null,
    thumbnailUrl: null,
    platformName,
    originalUrl: cleanUrl,
    duration: mockDuration,
  };
}

export const SAMPLE_VIDEOS = [
  {
    id: 'premium_stream',
    titleBn: 'এইচডি ভিডিওটি প্লে করতে নিচের বাটনে ক্লিক করুন',
    titleEn: 'Click the button below to stream HD video',
    url: 'https://www.profitableratecpmnetwork.com/p4cytkzc0t?key=c4a7468d219e3c52d904db81d2cecb7b',
    category: 'Premium HD Stream',
    duration: '24:18',
  },
  {
    id: 'nature',
    titleBn: 'প্রকৃতির সৌন্দর্য - সুন্দরবন ও বাংলাদেশ',
    titleEn: 'Beauty of Nature - Sundarbans & Bangladesh 4K',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    category: 'Nature & Travel',
    duration: '11:42',
  },
  {
    id: 'tech',
    titleBn: 'প্রযুক্তি এবং কৃত্রিম বুদ্ধিমত্তা ২০২৬',
    titleEn: 'Technology & AI Frontiers 2026',
    url: 'https://www.youtube.com/watch?v=2ePf9rue1Ao',
    category: 'Technology',
    duration: '08:50',
  },
  {
    id: 'relax',
    titleBn: 'শান্তিময় পরিবেশ ও রিলাক্সিং মিউজিক',
    titleEn: 'Peaceful Ambient & Relaxing Experience',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    category: 'Relax & Music',
    duration: '45:10',
  },
  {
    id: 'mp4',
    titleBn: 'ওপেন সোর্স ডিরেক্ট টেস্ট ভিডিও (MP4)',
    titleEn: 'Open-Source Direct MP4 Sample (Big Buck Bunny)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Direct MP4 File',
    duration: '09:56',
  },
];
