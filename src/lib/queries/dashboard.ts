import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/auth";
import { DashboardBooking, DashboardData, DashboardProfile, DashboardProperty, HostRetreat } from "@/types/dashboard";

export async function getDashboardData(
  userId: string
): Promise<DashboardData> {
  const supabase = await createClient();

  const [profileResult, rolesResult, retreatsResult, propertiesResult, bookingsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("name, bio, profile_photo, is_coop_member, onboarding_completed, show_in_directory")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
      supabase
        .from("retreats")
        .select("id, slug, title, status, retreat_type, start_date, end_date, max_attendees, price_per_person, main_image, custom_venue_name, created_at")
        .eq("host_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("id, name, location, property_type, status, photos")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id, booking_date, retreats(title, start_date, end_date)")
        .eq("attendee_user_id", userId)
        .order("booking_date", { ascending: false }),
    ]);

  const profileData = profileResult.data;
  const profile: DashboardProfile = {
    name: (profileData?.name as string) || null,
    bio: (profileData?.bio as string) || null,
    profile_photo: (profileData?.profile_photo as string) || null,
    is_coop_member: !!(profileData as Record<string, unknown>)?.is_coop_member,
    onboarding_completed:
      (profileData?.onboarding_completed as Record<string, boolean>) || null,
    profile_completed: !!(profileData?.show_in_directory),
  };

  const roles = (rolesResult.data || []).map(
    (r) => r.role as AppRole
  );

  // slug added via migration — cast to bypass generated types
  const hostRetreats: HostRetreat[] = ((retreatsResult.data || []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    slug: (r.slug as string) || (r.id as string),
    title: r.title as string,
    status: (r.status as string) || "draft",
    retreat_type: (r.retreat_type as string) || null,
    start_date: (r.start_date as string) || null,
    end_date: (r.end_date as string) || null,
    max_attendees: (r.max_attendees as number) || null,
    price_per_person: (r.price_per_person as number) || null,
    main_image: (r.main_image as string) || null,
    custom_venue_name: (r.custom_venue_name as string) || null,
    created_at: r.created_at as string,
  }));

  const properties: DashboardProperty[] = (propertiesResult.data || []).map(
    (p) => ({
      id: p.id as string,
      name: p.name as string,
      location: (p.location as string) || null,
      property_type: (p.property_type as string) || "venue",
      status: (p.status as string) || null,
      photos: (p.photos as string[]) || [],
    })
  );

  const bookings: DashboardBooking[] = (bookingsResult.data || []).map(
    (b) => {
      const retreat = b.retreats as unknown as {
        title: string;
        start_date: string | null;
        end_date: string | null;
      } | null;
      return {
        id: b.id as string,
        booking_date: b.booking_date as string,
        retreat_title: retreat?.title || null,
        retreat_start: retreat?.start_date || null,
        retreat_end: retreat?.end_date || null,
      };
    }
  );

  return { profile, roles, hostRetreats, properties, bookings };
}
export type { DashboardBooking, HostRetreat, DashboardProfile, DashboardProperty };

