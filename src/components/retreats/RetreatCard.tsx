"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Clock, Calendar } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDateRange } from "@/lib/utils/format";
import type { Retreat } from "@/lib/types";

interface RetreatCardProps {
  retreat: Retreat;
}

export default function RetreatCard({ retreat }: RetreatCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link
        href={`/retreats/${retreat.slug}`}
        className="group block bg-white rounded-[16px] overflow-hidden"
        style={{
          boxShadow: "0 4px 20px -4px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(45,95,59,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px -4px rgba(0,0,0,0.08)";
        }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {retreat.image ? (
            <Image
              src={retreat.image}
              alt={retreat.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant="primary">{retreat.category}</Badge>
          </div>
          {retreat.spotsLeft && retreat.spotsLeft <= 5 && (
            <div className="absolute top-4 right-4">
              <Badge variant="warning">{retreat.spotsLeft} spots left</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-display text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {retreat.title}
          </h3>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {retreat.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {retreat.duration}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDateRange(retreat.startDate, retreat.endDate)}
            </span>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2">
            {retreat.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
