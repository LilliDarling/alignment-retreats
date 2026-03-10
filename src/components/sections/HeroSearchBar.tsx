"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Tag, Calendar } from "lucide-react";
import { HeroSearchData } from "@/types/retreat";


interface HeroSearchBarProps {
  searchData?: HeroSearchData;
}

export default function HeroSearchBar({ searchData }: HeroSearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");

  const categories = searchData?.categories || [];
  const locations = searchData?.locations || [];
  const months = searchData?.months || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (month) params.set("month", month);
    const qs = params.toString();
    router.push(qs ? `/retreats?${qs}` : "/retreats");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.1 }}
      className="mt-10 w-full max-w-3xl mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-background rounded-xl text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-background rounded-xl text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-background rounded-xl text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">When</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="sm:hidden lg:inline">Search</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
