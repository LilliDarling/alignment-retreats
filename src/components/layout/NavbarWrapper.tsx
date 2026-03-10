import { createClient } from "@/lib/supabase/server";
import { getFeaturedRetreats, getFeaturedVenues, getRetreatCategories } from "@/lib/queries/retreats";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData = null;

  if (user) {
    const [{ data: profile }, { data: rolesData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, profile_photo, is_coop_member")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
    ]);

    // Use profile name, then auth display_name, then email prefix
    const displayName =
      profile?.name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      null;

    userData = {
      email: user.email || "",
      fullName: displayName,
      roles: (rolesData || []).map((r: { role: string }) => r.role),
      avatarUrl: (profile?.profile_photo as string) || null,
      isCoopMember: (profile?.is_coop_member as boolean) || false,
    };
  }

  const [featuredRetreats, featuredVenues, categories] = await Promise.all([
    getFeaturedRetreats(2),
    getFeaturedVenues(2),
    getRetreatCategories(),
  ]);

  return (
    <Navbar
      user={userData}
      featuredRetreats={featuredRetreats}
      featuredVenues={featuredVenues}
      categories={categories}
    />
  );
}
