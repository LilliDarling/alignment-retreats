"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  MapPin,
  Users,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Retreat } from "@/lib/types";

interface VenueSidebarProps {
  property: NonNullable<Retreat["property"]>;
}

export default function VenueSidebar({ property }: VenueSidebarProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const allMedia = [
    ...property.photos.map((url) => ({ type: "photo" as const, url })),
    ...property.videos.map((url) => ({ type: "video" as const, url })),
  ];

  const prev = () =>
    setPhotoIndex((i) => (i === 0 ? allMedia.length - 1 : i - 1));
  const next = () =>
    setPhotoIndex((i) => (i === allMedia.length - 1 ? 0 : i + 1));

  // Auto-rotate photos every 5 seconds (pause on videos)
  const isVideo = allMedia[photoIndex]?.type === "video";
  const mediaCount = allMedia.length;
  useEffect(() => {
    if (mediaCount <= 1 || isVideo) return;
    const timer = setInterval(() => {
      setPhotoIndex((i) => (i === mediaCount - 1 ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [photoIndex, mediaCount, isVideo]);

  return (
    <div className="bg-white rounded-[16px] border border-border overflow-hidden sticky top-[100px]">
      {/* Photo/Video Carousel */}
      {allMedia.length > 0 && (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {allMedia[photoIndex].type === "video" ? (
            <video
              src={allMedia[photoIndex].url}
              className="w-full h-full object-cover"
              controls
              playsInline
              muted
              preload="auto"
            />
          ) : (
            <Image
              src={allMedia[photoIndex].url}
              alt={`${property.name} - ${photoIndex + 1}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          )}

          {allMedia.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allMedia.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                      i === photoIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Venue Name & Location */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-display text-foreground">{property.name}</h3>
          </div>
          {property.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 ml-6">
              <MapPin className="w-3.5 h-3.5" />
              {property.location}
            </p>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
              About the Venue
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {property.description}
            </p>
          </div>
        )}

        {/* Quick Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {property.capacity && (
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Up to {property.capacity} guests
            </span>
          )}
          <span className="flex items-center gap-1.5 capitalize">
            <Home className="w-3.5 h-3.5" />
            {property.property_type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Property Features */}
        {property.property_features.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
              Property Features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {property.property_features.map((feature) => (
                <span
                  key={feature}
                  className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
