import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HERO_VIDEO_URL } from '@/config/constants';

interface VideoHeroSectionProps {
  videoSrc?: string;
}

const VideoHeroSection = ({ videoSrc = HERO_VIDEO_URL }: VideoHeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's ok
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y }}
        className="absolute inset-0"
      >
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
          // @ts-expect-error fetchpriority not yet in React types
          fetchpriority="high"
        />
      </motion.div>

      {/* Persistent gradient overlay with parallax fade */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"
      />
    </div>
  );
};

export default VideoHeroSection;
