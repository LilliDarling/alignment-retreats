"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import HeroSearchBar from "@/components/sections/HeroSearchBar";
import { siteConfig } from "@/lib/data/site";
import { useIsAuthenticated } from "@/lib/hooks/useAuth";
import { HeroSearchData } from "@/types/retreat";

interface HeroHomeProps {
  searchData?: HeroSearchData;
}

export default function HeroHome({ searchData }: HeroHomeProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const prefersReducedMotion = useReducedMotion();

  // Deployed app's video parallax — uses global scrollY for video layer
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 600], prefersReducedMotion ? [0, 0] : [0, 200]);
  const videoOpacity = useTransform(scrollY, [0, 400], prefersReducedMotion ? [1, 1] : [1, 0.3]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], prefersReducedMotion ? [0.15, 0.15] : [0.05, 0.4]);

  // Ensure video plays (autoplay may be blocked)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);
  const h1Y = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -80]);
  const buttonsY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -100]);
  const buttonsOpacity = useTransform(scrollYProgress, [0, 0.4], prefersReducedMotion ? [1, 1] : [1, 0]);
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.1], prefersReducedMotion ? [1, 1] : [1, 0]);

  const isAuthenticated = useIsAuthenticated();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: videoY }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src={siteConfig.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </motion.div>

        {/* Gradient overlay with parallax fade */}
        <motion.div
          style={{ opacity: videoOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"
        />
      </div>

      {/* Scroll-driven dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Content — copy from deployed app */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto pt-20 sm:pt-0">
        <motion.div style={{ y: h1Y }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-white text-5xl sm:text-6xl lg:text-[72px] font-display leading-tight mb-6 drop-shadow-lg">
              Align With Your
              <br />
              Perfect Retreat
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl sm:text-2xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Host, Discover, and Thrive Together
          </motion.p>
        </motion.div>

        <motion.div style={{ y: buttonsY, opacity: buttonsOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button href="/retreats" size="lg" variant="primary">
              Browse Retreats
            </Button>
            <Button
              href={isAuthenticated ? "/dashboard" : "/contact"}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              {isAuthenticated ? "Go to Dashboard" : "Collaborate"}
            </Button>
          </motion.div>
        </motion.div>

        <HeroSearchBar searchData={searchData} />
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: chevronOpacity }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
