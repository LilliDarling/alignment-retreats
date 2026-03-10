import type { Metadata } from "next";
import VenuesClient from "@/components/venues/VenuesClient";
import { getVenues } from "@/lib/queries/retreats";

export const metadata: Metadata = {
  title: "Browse Venues | Alignment Retreats",
  description:
    "Discover the perfect space for your next transformative experience. Browse retreat venues around the world.",
};

export default async function VenuesPage() {
  const venues = await getVenues();

  return <VenuesClient venues={venues} />;
}
