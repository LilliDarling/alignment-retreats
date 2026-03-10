"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimationType =
  | "fadeUp"
  | "fadeIn"
  | "fadeLeft"
  | "fadeRight"
  | "scaleIn"
  | "zoomIn"
  | "staggerUp"
  | "parallaxUp";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  staggerDelay?: number;
}

const offsets: Record<string, { x?: number; y?: number; scale?: number }> = {
  fadeUp: { y: 40 },
  fadeIn: {},
  fadeLeft: { x: -40 },
  fadeRight: { x: 40 },
  scaleIn: { scale: 0.95 },
  zoomIn: { scale: 0.85 },
  staggerUp: { y: 30 },
  parallaxUp: { y: 60 },
};

export default function AnimateOnScroll({
  children,
  animation = "fadeUp",
  delay = 0,
  duration = 0.6,
  className,
  staggerDelay = 0.08,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  if (animation === "parallaxUp") {
    return (
      <ParallaxWrapper className={className}>{children}</ParallaxWrapper>
    );
  }

  if (animation === "staggerUp") {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: staggerDelay } },
          hidden: {},
        }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    );
  }

  const offset = offsets[animation];

  return (
    <motion.div
      ref={ref}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, scale: 1 }
          : {
              opacity: 0,
              x: offset.x ?? 0,
              y: offset.y ?? 0,
              scale: offset.scale ?? 1,
            }
      }
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

function ParallaxWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
