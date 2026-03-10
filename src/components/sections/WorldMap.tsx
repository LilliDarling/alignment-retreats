"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { motion, useInView } from "framer-motion";
import { MapPin, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MapRetreat } from "@/types/retreat";



const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Brand colors
const MAP_BG = "hsl(94 27% 14%)";
const MAP_TEXT = "hsl(37 29% 95%)";
const MAP_TEXT_MUTED = "hsl(37 22% 88%)";
const MAP_LAND = "hsla(94 27% 30% / 0.15)";
const MAP_LAND_HOVER = "hsla(94 27% 30% / 0.25)";
const MAP_STROKE = "hsl(37 22% 88%)";
const MAP_MARKER_FILL = "hsl(37 29% 95%)";
const MAP_MARKER_STROKE = "hsl(94 27% 14%)";

function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface LocationGroup {
  key: string;
  coordinates: { lat: number; lng: number };
  retreats: MapRetreat[];
}

interface WorldMapProps {
  retreats?: MapRetreat[];
}

export default function WorldMap({ retreats = [] }: WorldMapProps) {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Group retreats by coordinates
  const locationGroups = useMemo(() => {
    const groups = new Map<string, LocationGroup>();
    for (const retreat of retreats) {
      const key = `${retreat.coordinates.lat},${retreat.coordinates.lng}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          coordinates: retreat.coordinates,
          retreats: [],
        });
      }
      groups.get(key)!.retreats.push(retreat);
    }
    return [...groups.values()];
  }, [retreats]);

  const activeGroup = locationGroups.find((g) => g.key === activeLocation);
  const activeRetreat = activeGroup?.retreats[activeIndex] ?? null;

  // Click outside map container dismisses the active card
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (mapContainerRef.current && !mapContainerRef.current.contains(e.target as Node)) {
        setActiveLocation(null);
        setActiveIndex(0);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleMarkerClick(key: string) {
    if (activeLocation === key) {
      // If same location, cycle to next retreat
      const group = locationGroups.find((g) => g.key === key);
      if (group && group.retreats.length > 1) {
        setActiveIndex((prev) => (prev + 1) % group.retreats.length);
      } else {
        setActiveLocation(null);
        setActiveIndex(0);
      }
    } else {
      setActiveLocation(key);
      setActiveIndex(0);
    }
  }

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{ backgroundColor: MAP_BG }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.15em] mb-3"
            style={{ color: MAP_TEXT_MUTED }}
          >
            Global Community
          </p>
          <h2
            className="text-2xl sm:text-3xl font-display"
            style={{ color: MAP_TEXT }}
          >
            Retreats Worldwide
          </h2>
          <p
            className="mt-3 max-w-lg mx-auto text-sm opacity-60"
            style={{ color: MAP_TEXT }}
          >
            From the Amazon rainforest to the red rocks of Sedona — transformative
            experiences on every continent.
          </p>
        </motion.div>

        <motion.div
          ref={mapContainerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="w-full max-w-[900px] mx-auto">
            <ComposableMap
              projection="geoNaturalEarth1"
              projectionConfig={{ scale: 160, center: [10, 10] }}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties.name !== "Antarctica")
                    .map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={MAP_LAND}
                        stroke={MAP_STROKE}
                        strokeWidth={0.3}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: MAP_LAND_HOVER },
                          pressed: { outline: "none" },
                        }}
                      />
                    ))
                }
              </Geographies>

              {locationGroups.map((group, i) => (
                <Marker
                  key={group.key}
                  coordinates={[group.coordinates.lng, group.coordinates.lat]}
                  onMouseEnter={() => {
                    if (!activeLocation) {
                      setActiveLocation(group.key);
                      setActiveIndex(0);
                    }
                  }}
                  onClick={() => handleMarkerClick(group.key)}
                >
                  <circle r={12} fill="none" stroke={MAP_MARKER_FILL} strokeWidth={1} opacity={0.4}>
                    <animate attributeName="r" from="6" to="16" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle
                    r={activeLocation === group.key ? 7 : 5}
                    fill={MAP_MARKER_FILL}
                    stroke={MAP_MARKER_STROKE}
                    strokeWidth={2}
                    style={{ cursor: "pointer", transition: "r 0.2s ease" }}
                  />
                  {/* Badge showing count if multiple retreats */}
                  {group.retreats.length > 1 && (
                    <>
                      <circle
                        cx={6}
                        cy={-6}
                        r={7}
                        fill="hsl(94 27% 30%)"
                        stroke={MAP_MARKER_FILL}
                        strokeWidth={1}
                      />
                      <text
                        x={6}
                        y={-3}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight="bold"
                        fill={MAP_MARKER_FILL}
                      >
                        {group.retreats.length}
                      </text>
                    </>
                  )}
                </Marker>
              ))}
            </ComposableMap>
          </div>

          {/* Info card — shows on click/hover */}
          {activeRetreat && activeGroup && (
            <motion.div
              key={activeRetreat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-[16px] shadow-xl p-5 w-[320px] sm:w-[380px] z-10"
            >
              {/* Pagination header for multiple retreats */}
              {activeGroup.retreats.length > 1 && (
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <button
                    onClick={() =>
                      setActiveIndex(
                        (prev) => (prev - 1 + activeGroup.retreats.length) % activeGroup.retreats.length
                      )
                    }
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground font-medium">
                    {activeIndex + 1} of {activeGroup.retreats.length} retreats
                  </span>
                  <button
                    onClick={() =>
                      setActiveIndex(
                        (prev) => (prev + 1) % activeGroup.retreats.length
                      )
                    }
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${activeRetreat.image})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary mb-1">
                    {activeRetreat.category}
                  </p>
                  <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {activeRetreat.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activeRetreat.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {activeRetreat.duration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-primary font-bold text-sm">
                      {formatPrice(activeRetreat.price, activeRetreat.currency)}
                    </span>
                    <Link
                      href={`/retreats/${activeRetreat.slug}`}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Mobile: location list */}
        {retreats.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {retreats.map((retreat) => (
              <Link
                key={retreat.id}
                href={`/retreats/${retreat.slug}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                style={{ backgroundColor: "hsla(0 0% 100% / 0.1)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${retreat.image})` }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: MAP_TEXT }}>
                    {retreat.title}
                  </p>
                  <p className="text-xs flex items-center gap-1 opacity-50" style={{ color: MAP_TEXT }}>
                    <MapPin className="w-3 h-3" />
                    {retreat.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
