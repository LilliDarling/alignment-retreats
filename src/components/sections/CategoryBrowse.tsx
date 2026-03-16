"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Distinct images per category keyword
const categoryImages: Record<string, string> = {
  healing:
    "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=400&fit=crop",
  spiritual:
    "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&h=400&fit=crop",
  yoga:
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&h=400&fit=crop",
  leadership:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
  mindfulness:
    "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?w=600&h=400&fit=crop",
  breathwork:
    "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600&h=400&fit=crop",
  adventure:
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
  wellness:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
  meditation:
    "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&h=400&fit=crop",
  retreat:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
};

const defaultImage =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop";

function getImageForCategory(category: string): string {
  const lower = category.toLowerCase();
  // Exact match first
  if (categoryImages[lower]) return categoryImages[lower];
  // Then try splitting multi-word categories and matching the first unique keyword
  const words = lower.split(/[\s&,]+/).filter(Boolean);
  for (const word of words) {
    if (categoryImages[word]) return categoryImages[word];
  }
  return defaultImage;
}

interface CategoryBrowseProps {
  categories?: string[];
}

export default function CategoryBrowse({ categories = [] }: CategoryBrowseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  if (categories.length === 0) return null;

  // When items fit (≤4), use grid at all breakpoints; only scroll when 5+
  const fitsOnScreen = categories.length <= 4;
  const mobileColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };
  const lgColsMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };
  const mobileCols = mobileColsMap[categories.length] || "";
  const lgCols = lgColsMap[categories.length] || "lg:grid-cols-5";

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-3 text-center">
          Explore
        </p>
        <h2 className="text-2xl sm:text-3xl text-center mb-10">
          Browse by Category
        </h2>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
            hidden: {},
          }}
          className={
            fitsOnScreen
              ? `grid ${mobileCols} ${lgCols} gap-4`
              : `flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 ${lgCols} lg:grid lg:overflow-visible`
          }
        >
          {categories.map((cat) => (
            <motion.div
              key={cat}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className={fitsOnScreen ? "" : "shrink-0 w-[200px] lg:w-auto"}
            >
              <Link
                href={`/retreats?category=${encodeURIComponent(cat)}`}
                className="group block relative aspect-[3/4] rounded-[16px] overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${getImageForCategory(cat)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-semibold text-sm leading-snug">
                    {cat}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
