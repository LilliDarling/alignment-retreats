import { createClient } from "@/lib/supabase/server";
import type { HostProfileData } from "@/types/profile";

export async function getPublicProfile(profileId: string): Promise<HostProfileData | null> {
  try {
    const supabase = await createClient();

    const [{ data: profileData, error }, { data: rolesData }] = await Promise.all([
      supabase.rpc("get_public_profile", { profile_id: profileId }),
      supabase.from("user_roles").select("role").eq("user_id", profileId),
    ]);

    if (error) {
      console.error("Error fetching public profile:", error.message);
      return null;
    }

    const profile = (profileData as Omit<HostProfileData, "user_roles">[] | null)?.[0];
    if (!profile) return null;

    return {
      ...profile,
      user_roles: (rolesData || []).map((r: { role: string }) => r.role),
    };
  } catch {
    return null;
  }
}

export async function getPublicProfileBySlug(slug: string): Promise<HostProfileData | null> {
  try {
    const supabase = await createClient();

    // RPC added via migration — cast to bypass generated types until regenerated
    const { data: profileData, error } = await supabase.rpc(
      "get_public_profile_by_slug" as never,
      { profile_slug: slug } as never,
    ) as { data: unknown; error: { message: string } | null };

    if (error) {
      console.error("Error fetching public profile by slug:", error.message);
      return null;
    }

    const profile = (profileData as (Omit<HostProfileData, "user_roles"> & { id: string })[] | null)?.[0];
    if (!profile) return null;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);

    return {
      ...profile,
      user_roles: (rolesData || []).map((r: { role: string }) => r.role),
    };
  } catch {
    return null;
  }
}
