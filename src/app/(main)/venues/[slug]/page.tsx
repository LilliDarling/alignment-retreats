import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVenueById, getOwnProperty } from "@/lib/queries/retreats";
import VenueDetailClient from "@/components/venues/VenueDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueById(slug);
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

async function getUserRoles(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data || []).map((r: { role: string }) => r.role);
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try public published venue first
  const venue = await getVenueById(slug);
  if (venue) {
    const userRoles = user ? await getUserRoles(user.id) : [];
    return (
      <VenueDetailClient
        venue={venue}
        isPreview={false}
        isHost={userRoles.includes("host")}
        isAuthenticated={!!user}
      />
    );
  }

  // Check if the viewer is the owner (draft/pending preview)
  if (user) {
    const ownProperty = await getOwnProperty(slug, user.id);
    if (ownProperty) {
      return <VenueDetailClient venue={ownProperty} isPreview={true} />;
    }
  }

  notFound();
}
