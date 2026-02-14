import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  themeColor?: string;
}

export function AudioPlayer({ url, themeColor = '#4b4132' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract embed URL for Spotify/SoundCloud
  const getEmbedUrl = (inputUrl: string): string | null => {
    // Spotify track URL
    if (inputUrl.includes('spotify.com/track/')) {
      const trackId = inputUrl.split('track/')[1]?.split('?')[0];
      return trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0` : null;
    }
    // SoundCloud - would need their widget API
    if (inputUrl.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(inputUrl)}&auto_play=false&color=${themeColor.replace('#', '')}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return null;
  }

  // For Spotify, use iframe embed
  if (url.includes('spotify.com')) {
    return (
      <div className="w-full max-w-xs">
        <iframe
          src={embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
        />
      </div>
    );
  }

  // For SoundCloud
  if (url.includes('soundcloud.com')) {
    return (
      <div className="w-full max-w-xs">
        <iframe
          width="100%"
          height="80"
          scrolling="no"
          frameBorder="no"
          src={embedUrl}
          className="rounded-lg"
        />
      </div>
    );
  }

  return null;
}
