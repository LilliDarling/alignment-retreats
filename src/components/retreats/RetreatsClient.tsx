"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useInView } from "framer-motion";
import PageHero from "@/components/layout/PageHero";
import RetreatCard from "@/components/retreats/RetreatCard";
import RetreatFilters, { type FilterState } from "@/components/retreats/RetreatFilters";
import type { Retreat } from "@/lib/types";

interface RetreatsClientProps {
  retreats: Retreat[];
}

export default function RetreatsClient({ retreats }: RetreatsClientProps) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: searchParams.get("category") || "",
    priceRange: "",
    duration: "",
  });

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setFilters((f) => ({ ...f, category: cat }));
  }, [searchParams]);

  const categories = useMemo(
    () => [...new Set(retreats.map((r) => r.category))],
    [retreats]
  );

  const filtered = useMemo(() => {
    return retreats.filter((r) => {
      if (
        filters.search &&
        !r.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !r.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.category && r.category !== filters.category) return false;
      if (filters.priceRange) {
        if (filters.priceRange === "0-2000" && r.price > 2000) return false;
        if (filters.priceRange === "2000-4000" && (r.price < 2000 || r.price > 4000)) return false;
        if (filters.priceRange === "4000+" && r.price < 4000) return false;
      }
      if (filters.duration) {
        const days = parseInt(r.duration);
        if (filters.duration === "short" && days > 4) return false;
        if (filters.duration === "medium" && (days < 5 || days > 7)) return false;
        if (filters.duration === "long" && days < 8) return false;
      }
      return true;
    });
  }, [filters, retreats]);

  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, amount: 0.05 });

  return (
    <>
      <PageHero
        title="Browse Retreats"
        subtitle="Discover transformative experiences curated by our community"
        backgroundImage="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=600&fit=crop"
      />

      <section className="py-12 sm:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-4 mb-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, category: "" }))}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                  filters.category === ""
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      category: f.category === cat ? "" : cat,
                    }))
                  }
                  className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                    filters.category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <RetreatFilters filters={filters} onFilter={setFilters} categories={categories} />

          {filtered.length > 0 ? (
            <motion.div
              ref={gridRef}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
                hidden: {},
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filtered.map((retreat) => (
                <motion.div
                  key={retreat.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: "easeOut" },
                    },
                  }}
                >
                  <RetreatCard retreat={retreat} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                {retreats.length === 0
                  ? "No retreats available yet. Check back soon!"
                  : "No retreats match your filters. Try adjusting your search."}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              {filtered.length} retreat{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </section>
    </>
  );
}
