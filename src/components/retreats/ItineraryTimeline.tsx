"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export default function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  return (
    <div ref={containerRef} className="relative">
      <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-border" />
      <motion.div
        className="absolute left-6 sm:left-8 top-0 w-0.5 bg-primary origin-top"
        style={{ scaleY: scrollYProgress, height: "100%" }}
      />

      <div className="space-y-8">
        {days.map((day, index) => (
          <TimelineNode key={day.day} day={day} index={index} />
        ))}
      </div>
    </div>
  );
}

function TimelineNode({ day, index }: { day: ItineraryDay; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-16 sm:pl-20"
    >
      <motion.div
        className="absolute left-4 sm:left-6 top-1 w-4 h-4 rounded-full border-2 border-primary"
        animate={
          isInView
            ? { backgroundColor: "hsl(var(--primary))" }
            : { backgroundColor: "white" }
        }
        transition={{ delay: 0.3 + index * 0.1 }}
      />

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
              Day {day.day}
            </span>
            <h4 className="text-lg font-display text-foreground group-hover:text-primary transition-colors">
              {day.title}
            </h4>
            {day.theme && (
              <p className="text-sm text-muted-foreground italic mt-0.5">
                {day.theme}
              </p>
            )}
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 ml-4"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="pt-4 space-y-3">
          {day.activities.map((activity, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide w-20 shrink-0 pt-0.5">
                {activity.time}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
            </div>
          ))}
          {day.outcome && (
            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-primary font-medium">
                Outcome: {day.outcome}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
