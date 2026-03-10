import type { Metadata } from "next";
import { Suspense } from "react";
import RetreatsClient from "@/components/retreats/RetreatsClient";
import { getRetreats } from "@/lib/queries/retreats";

export const metadata: Metadata = {
  title: "Browse Retreats | Alignment Retreats",
  description:
    "Discover transformative retreat experiences curated by our community. Browse retreats for alignment, wellness, and personal growth.",
};

export default async function RetreatsPage() {
  const retreats = await getRetreats();

  return (
    <Suspense>
      <RetreatsClient retreats={retreats} />
    </Suspense>
  );
}
