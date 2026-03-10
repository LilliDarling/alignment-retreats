"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { PageHeroProps } from "@/types/ui";

export default function PageHero({
  title,
  subtitle,
  backgroundImage,
  compact = false,
  children,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex items-center justify-center text-center overflow-hidden",
        compact ? "min-h-[40vh] pt-28 pb-16" : "min-h-[50vh] pt-32 pb-20"
      )}
    >
      {/* Background */}
      {backgroundImage ? (
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
            }}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-primary/60" />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll animation="fadeUp">
          <h1 className="text-white mb-4">{title}</h1>
          {subtitle && (
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          {children}
        </AnimateOnScroll>
      </div>
    </section>
  );
}
