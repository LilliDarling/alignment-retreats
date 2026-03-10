import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnProfile } from "@/lib/actions/profile";
import ProfileClient from "@/components/account/ProfileClient";

export const metadata = {
  title: "My Profile | Alignment Retreats",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  // If profile isn't completed yet, send to setup wizard
  if (!profile.profile_completed && !profile.name) {
    redirect("/account/setup");
  }

  return <ProfileClient profile={profile} />;
}
