import { notFound } from "next/navigation";
import { getVenueById } from "@/lib/queries/retreats";
import VenueDetailClient from "@/components/venues/VenueDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) return { title: "Venue Not Found" };
  return {
    title: `${venue.name} | Alignment Retreats`,
    description:
      venue.description ||
      `Discover ${venue.name} — a stunning venue for your next retreat.`,
    openGraph: venue.photos[0]
      ? { images: [{ url: venue.photos[0], width: 800, height: 600 }] }
      : undefined,
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  return <VenueDetailClient venue={venue} />;
}
