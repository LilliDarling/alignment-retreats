"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import Button from "@/components/ui/Button";

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
  hidden: {},
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

// TODO: Update copy throughout this section
// The layout/structure comes from the demo's ValueProp
// but the messaging should align with the deployed app's voice
// Current copy below is placeholder from the demo — replace with final copy

export default function ValueProp() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section className="section-padding bg-muted">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[180px] sm:auto-rows-[200px]"
        >
          {/* Large image tile — 2x2 */}
          <motion.div
            variants={fadeUp}
            className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 relative rounded-[16px] overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop"
              alt="Yoga retreat group"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              {/* TODO: Update heading copy */}
              <span className="section-subtitle !text-primary-foreground/70">The Cooperative Model</span>
              <h3 className="text-white text-xl sm:text-2xl">
                Built by the Community,
                <br />
                For the Community
              </h3>
            </div>
          </motion.div>

          {/* Text tile */}
          <motion.div
            variants={fadeUp}
            className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-white rounded-[16px] p-6 flex flex-col justify-center border border-border"
          >
            {/* TODO: Update body copy — this is from the deployed app's collaborate section */}
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Alignment Retreats is a cooperative platform connecting retreat
              hosts, co-hosts, venues, and collaborators. Unlike traditional
              marketplaces that extract value, our model ensures everyone has a
              stake in the platform&apos;s success.
            </p>
          </motion.div>

          {/* Quote tile */}
          <motion.div
            variants={fadeUp}
            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 bg-primary rounded-[16px] p-6 flex flex-col justify-center"
          >
            {/* TODO: Update quote copy */}
            <p className="text-primary-foreground/90 font-display text-lg leading-snug">
              &ldquo;Revenue is shared fairly. Decisions are made collectively.&rdquo;
            </p>
            <p className="text-primary-foreground/50 text-sm mt-2">Our philosophy</p>
          </motion.div>

          {/* Accent image */}
          <motion.div
            variants={fadeUp}
            className="col-span-1 lg:col-span-1 row-span-1 relative rounded-[16px] overflow-hidden hidden md:block"
          >
            <Image
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop"
              alt="Meditation"
              fill
              className="object-cover"
              sizes="200px"
            />
          </motion.div>

          {/* CTA tile */}
          <motion.div
            variants={fadeUp}
            className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 bg-background rounded-[16px] p-6 flex items-center justify-between border border-border"
          >
            <div>
              {/* TODO: Update CTA copy */}
              <p className="text-foreground font-semibold mb-1">
                Transformation is the bottom line.
              </p>
              <p className="text-sm text-muted-foreground">
                Join to host, collaborate, or discover retreats.
              </p>
            </div>
            <Button href="/about" size="sm" className="whitespace-nowrap">
              Our Story
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
