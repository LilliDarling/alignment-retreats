"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import RetreatCard from "@/components/retreats/RetreatCard";
import Button from "@/components/ui/Button";
import type { Retreat } from "@/lib/types";

interface FeaturedRetreatsProps {
  retreats: Retreat[];
}

export default function FeaturedRetreats({ retreats }: FeaturedRetreatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  if (retreats.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="Featured"
          title="Featured Retreats"
          description="Handpicked transformative experiences from our community"
        />

        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
        >
          {retreats.map((retreat) => (
            <motion.div
              key={retreat.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <RetreatCard retreat={retreat} />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <Button href="/retreats" variant="outline">
            View All Retreats
          </Button>
        </div>
      </div>
    </section>
  );
}
