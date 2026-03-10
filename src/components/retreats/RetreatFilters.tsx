"use client";

import { Search } from "lucide-react";

interface RetreatFiltersProps {
  filters: FilterState;
  onFilter: (filters: FilterState) => void;
  categories: string[];
}

export interface FilterState {
  search: string;
  category: string;
  priceRange: string;
  duration: string;
}

export default function RetreatFilters({ filters, onFilter, categories }: RetreatFiltersProps) {
  const update = (key: keyof FilterState, value: string) => {
    onFilter({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm border border-border mb-10 focus-within:shadow-md focus-within:border-primary transition-all duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search retreats..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="input-base pl-10 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={filters.category}
          onChange={(e) => update("category", e.target.value)}
          className="input-base appearance-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filters.priceRange}
          onChange={(e) => update("priceRange", e.target.value)}
          className="input-base appearance-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Any Price</option>
          <option value="0-2000">Under $2,000</option>
          <option value="2000-4000">$2,000 – $4,000</option>
          <option value="4000+">$4,000+</option>
        </select>

        <select
          value={filters.duration}
          onChange={(e) => update("duration", e.target.value)}
          className="input-base appearance-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Any Duration</option>
          <option value="short">1–4 days</option>
          <option value="medium">5–7 days</option>
          <option value="long">8+ days</option>
        </select>
      </div>
    </div>
  );
}
