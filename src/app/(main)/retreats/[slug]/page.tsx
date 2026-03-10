import { notFound } from "next/navigation";
import { getRetreatBySlug, getRetreats, getHostProfile, getRetreatTeamMembers, getProfilesByIds } from "@/lib/queries/retreats";
import { createClient } from "@/lib/supabase/server";
import RetreatDetailClient from "@/components/retreats/RetreatDetailClient";

interface RetreatPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RetreatPageProps) {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) return { title: "Retreat Not Found" };
  return {
    title: `${retreat.title} | Alignment Retreats`,
    description: retreat.description,
    openGraph: {
      images: retreat.image ? [{ url: retreat.image, width: 800, height: 600 }] : [],
    },
  };
}

export default async function RetreatDetailPage({ params }: RetreatPageProps) {
  const { slug } = await params;
  const retreat = await getRetreatBySlug(slug);
  if (!retreat) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Non-published retreats are only visible to their host
  const retreatData = retreat as unknown as Record<string, unknown>;
  const retreatStatus = (retreatData.status as string) || "published";
  const isOwner = user?.id === retreat.hostId;

  if (retreatStatus !== "published" && retreatStatus !== "full" && !isOwner) {
    notFound();
  }

  const [hostProfile, teamMembers] = await Promise.all([
    retreat.hostId ? getHostProfile(retreat.hostId) : Promise.resolve(null),
    getRetreatTeamMembers(retreat.id),
  ]);

  // Attach team members to retreat and fetch their full profiles
  if (teamMembers.length > 0) {
    retreat.teamMembers = teamMembers;
  }

  const teamMemberUserIds = teamMembers.map((tm) => tm.userId).filter(Boolean);
  const [teamProfiles, allRetreats] = await Promise.all([
    getProfilesByIds(teamMemberUserIds),
    getRetreats(),
  ]);
  const relatedRetreats = allRetreats
    .filter((r) => r.id !== retreat.id)
    .slice(0, 3);

  return (
    <RetreatDetailClient
      retreat={retreat}
      relatedRetreats={relatedRetreats}
      hostProfile={hostProfile}
      teamProfiles={teamProfiles}
      isAuthenticated={!!user}
      isPreview={retreatStatus !== "published" && retreatStatus !== "full"}
    />
  );
}
