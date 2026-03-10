"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import PageHero from "@/components/layout/PageHero";
import VenueCard from "@/components/venues/VenueCard";
import Button from "@/components/ui/Button";
import { VenueListItem } from "@/types/venue";

interface VenuesClientProps {
  venues: VenueListItem[];
}

export default function VenuesClient({ venues }: VenuesClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, amount: 0.05 });

  return (
    <>
      <PageHero
        title="Browse Retreat Venues"
        subtitle="Discover the perfect space for your next transformative experience"
        backgroundImage="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=600&fit=crop"
      />

      <section className="section-padding">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {venues.length > 0 ? (
            <motion.div
              ref={gridRef}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {},
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            >
              {venues.map((venue) => (
                <motion.div
                  key={venue.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: "easeOut" },
                    },
                  }}
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No venues available yet. Check back soon!
              </p>
            </div>
          )}

          <div className="text-center p-12 bg-muted rounded-[16px] border border-border">
            <h3 className="mb-3">Have a venue to share?</h3>
            <p className="text-muted-foreground mb-6">
              List your property and connect with retreat hosts around the world.
            </p>
            <Button href="/contact">Submit Your Venue</Button>
          </div>
        </div>
      </section>
    </>
  );
}
