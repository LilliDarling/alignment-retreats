import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/actions/profile";
import ProfileSetup from "@/components/account/ProfileSetup";

export const metadata = {
  title: "Complete Your Profile | Alignment Retreats",
};

export default async function SetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return <ProfileSetup profile={profile} />;
}
