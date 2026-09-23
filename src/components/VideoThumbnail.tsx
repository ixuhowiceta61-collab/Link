import React from 'react';

export interface VideoMetadata {
  title: string;
  thumbnailUrl: string;
  duration?: string;
}

interface VideoThumbnailProps {
  metadata: VideoMetadata;
  onClick?: () => void;
  className?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  metadata,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      style={{ position: 'relative', width: '100%', maxWidth: '420px' }}
      className={`relative ${className}`}
    >
      {/* ভিডিও থাম্বনেইল ইমেজ */}
      <img
        src={metadata.thumbnailUrl}
        alt={metadata.title}
        style={{ width: '100%', display: 'block', borderRadius: '8px' }}
      />

      {/* ভিডিও ডিউরেশন ওভারলে (নিচে ডান কোনায়) */}
      {metadata.duration && (
        <span
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
          }}
          className="font-mono tracking-tight shadow-md"
        >
          {metadata.duration}
        </span>
      )}
    </div>
  );
};

export default VideoThumbnail;
