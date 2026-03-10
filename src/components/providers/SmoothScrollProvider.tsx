"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

interface SmoothScrollContextValue {
  lenis: Lenis | null;
  pause: () => void;
  resume: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenis: null,
  pause: () => {},
  resume: () => {},
});

export function useLenis() {
  return useContext(SmoothScrollContext);
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenisRef.current = instance;
    setLenis(instance);

    const raf = (time: number) => {
      instance.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => {
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  const pause = () => lenisRef.current?.stop();
  const resume = () => lenisRef.current?.start();

  return (
    <SmoothScrollContext.Provider value={{ lenis, pause, resume }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
