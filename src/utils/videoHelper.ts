/**
 * Video link parsing and utility functions
 */

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'generic';
  embedUrl: string | null;
  thumbnailUrl: string | null;
  platformName: string;
  originalUrl: string;
}

export function parseVideoUrl(inputUrl: string): VideoInfo {
  const cleanUrl = inputUrl.trim();
  if (!cleanUrl) {
    return {
      type: 'generic',
      embedUrl: null,
      thumbnailUrl: null,
      platformName: 'Link',
      originalUrl: '',
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
  };
}

export const SAMPLE_VIDEOS = [
  {
    id: 'premium_stream',
    titleBn: 'এইচডি ভিডিওটি প্লে করতে নিচের বাটনে ক্লিক করুন',
    titleEn: 'Click the button below to stream HD video',
    url: 'https://www.profitableratecpmnetwork.com/h5can1a6kf?key=1f487ec4c12509fbc3ca2b1632129777',
    category: 'Premium HD Stream',
  },
  {
    id: 'nature',
    titleBn: 'প্রকৃতির সৌন্দর্য - সুন্দরবন ও বাংলাদেশ',
    titleEn: 'Beauty of Nature - Sundarbans & Bangladesh 4K',
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    category: 'Nature & Travel',
  },
  {
    id: 'tech',
    titleBn: 'প্রযুক্তি এবং কৃত্রিম বুদ্ধিমত্তা ২০২৬',
    titleEn: 'Technology & AI Frontiers 2026',
    url: 'https://www.youtube.com/watch?v=2ePf9rue1Ao',
    category: 'Technology',
  },
  {
    id: 'relax',
    titleBn: 'শান্তিময় পরিবেশ ও রিলাক্সিং মিউজিক',
    titleEn: 'Peaceful Ambient & Relaxing Experience',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    category: 'Relax & Music',
  },
  {
    id: 'mp4',
    titleBn: 'ওপেন সোর্স ডিরেক্ট টেস্ট ভিডিও (MP4)',
    titleEn: 'Open-Source Direct MP4 Sample (Big Buck Bunny)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Direct MP4 File',
  },
];
