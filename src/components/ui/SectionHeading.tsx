"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  description,
  centered = true,
  light = false,
  className,
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const words = title.split(" ");

  return (
    <div
      ref={ref}
      className={cn("mb-14", centered && "text-center", className)}
    >
      {subtitle && (
        <motion.span
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "section-subtitle block",
            light && "text-primary-foreground/70"
          )}
        >
          {subtitle}
        </motion.span>
      )}
      <h2 className={cn("mb-4", light ? "text-white" : "text-foreground")}>
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
            <motion.span
              className="inline-block"
              animate={
                isInView
                  ? { y: 0, opacity: 1 }
                  : { y: "100%", opacity: 0 }
              }
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h2>
      {description && (
        <motion.p
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={cn(
            "text-lg max-w-2xl leading-relaxed",
            centered && "mx-auto",
            light ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
