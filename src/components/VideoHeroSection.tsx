import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface VideoHeroSectionProps {
  videoId: string;
}

const VideoHeroSection = ({ videoId }: VideoHeroSectionProps) => {
  const [showMask, setShowMask] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  useEffect(() => {
    const timer = setTimeout(() => setShowMask(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y }}
        className="absolute inset-0"
      >
        <iframe
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: '177.78vh',
            minWidth: '100%',
            height: '56.25vw',
            minHeight: '120%',
            transform: 'translate(-50%, -50%)',
          }}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&cc_load_policy=0&playsinline=1&modestbranding=1&disablekb=1&fs=0`}
          title="Background Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="eager"
        />
      </motion.div>

      {/* Short startup mask - fades out quickly */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
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
