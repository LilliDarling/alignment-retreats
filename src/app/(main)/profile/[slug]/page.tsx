import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/queries/profile";
import PublicProfile from "@/components/profile/PublicProfile";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) return { title: "Profile Not Found" };
  return {
    title: `${profile.name} | Alignment Retreats`,
    description: profile.bio || `View ${profile.name}'s profile on Alignment Retreats`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) notFound();

  return <PublicProfile profile={profile} />;
}
