"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { VenueListItem } from "@/types/venue";

interface VenueCardProps {
  venue: VenueListItem;
}

const typeLabels: Record<string, string> = {
  retreat_center: "Retreat Center",
  venue: "Venue",
  land: "Land",
};

export default function VenueCard({ venue }: VenueCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link
        href={`/venues/${venue.id}`}
        className="group block bg-white rounded-[16px] overflow-hidden"
        style={{
          boxShadow: "0 4px 20px -4px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 25px 50px -12px rgba(45,95,59,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 20px -4px rgba(0,0,0,0.08)";
        }}
      >
        <div className="relative aspect-[3/2] overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {venue.image ? (
            <Image
              src={venue.image}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="absolute top-3 left-3">
            <Badge variant="outline">
              {typeLabels[venue.property_type] || "Venue"}
            </Badge>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg mb-2 group-hover:text-primary transition-colors">
            {venue.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            {venue.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {venue.location}
              </span>
            )}
            {venue.capacity && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Up to {venue.capacity}
              </span>
            )}
          </div>
          {venue.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {venue.description}
            </p>
          )}
          {venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {venue.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="muted">
                  {amenity}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
