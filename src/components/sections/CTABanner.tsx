"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { useIsAuthenticated } from "@/lib/hooks/useAuth";

export default function CTABanner() {
  const isAuthenticated = useIsAuthenticated();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0 -top-20 -bottom-20"
        style={{ y: bgY }}
      >
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=800&fit=crop"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-primary/85" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <AnimateOnScroll>
          <span className="section-subtitle !text-primary-foreground/70">
            Start Your Journey
          </span>
          {/* Copy from deployed app */}
          <h2 className="text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Whether you&apos;re seeking transformation or creating it, Alignment
            Retreats is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/retreats" variant="white" size="lg">
              Explore Retreats
            </Button>
            <Button
              href={isAuthenticated ? "/dashboard" : "/signup"}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
