"use client";

import { MapRetreat } from "@/types/retreat";
import dynamic from "next/dynamic";


const WorldMap = dynamic(() => import("@/components/sections/WorldMap"), {
  ssr: false,
  loading: () => (
    <section className="section-padding bg-muted">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-[400px]" />
    </section>
  ),
});

interface WorldMapLazyProps {
  retreats?: MapRetreat[];
}

export default function WorldMapLazy({ retreats = [] }: WorldMapLazyProps) {
  return <WorldMap retreats={retreats} />;
}
