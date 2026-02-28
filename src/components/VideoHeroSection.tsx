import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HERO_VIDEO_URL } from '@/config/constants';

interface VideoHeroSectionProps {
  videoSrc?: string;
}

const VideoHeroSection = ({ videoSrc = HERO_VIDEO_URL }: VideoHeroSectionProps) => {
  const [showMask, setShowMask] = useState(true);
  const [loadVideo, setLoadVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  useEffect(() => {
    // Defer video loading until after initial paint
    const timer = setTimeout(() => setLoadVideo(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loadVideo) return;
    const timer = setTimeout(() => setShowMask(false), 400);
    return () => clearTimeout(timer);
  }, [loadVideo]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's ok
      });
    }
  }, [loadVideo]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y }}
        className="absolute inset-0"
      >
        {loadVideo && (
          <video
            ref={videoRef}
            className="absolute top-1/2 left-1/2 pointer-events-none object-cover"
            style={{
              width: '177.78vh',
              minWidth: '100%',
              height: '56.25vw',
              minHeight: '120%',
              transform: 'translate(-50%, -50%)',
            }}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}
      </motion.div>

      {/* Startup mask - covers until video is ready */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{ opacity: showMask ? 1 : 0, pointerEvents: 'none' }}
      />

      {/* Persistent gradient overlay with parallax fade */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"
      />
    </div>
  );
};

export default VideoHeroSection;
