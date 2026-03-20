import { createClient } from "@/lib/supabase/server";
import { parseLocalDate } from "@/lib/utils/format";
import { geocodeLocation } from "@/lib/data/locations";
import type { Retreat } from "@/lib/types";
import { HostProfileData } from "@/types/profile";
import { HeroSearchData, MapRetreat } from "@/types/retreat";
import { VenueDetail, VenueListItem, VenuePreview } from "@/types/venue";

// Convert Supabase row to app Retreat type
function toRetreat(row: Record<string, unknown>): Retreat {
  const r = row as Record<string, unknown>;
  const property = r.property as Record<string, unknown> | null;

  // Derive location from location_details, custom_venue_name, or property
  const location =
    (r.location_details as string) ||
    (r.custom_venue_name as string) ||
    (property?.location as string) ||
    (property?.name as string) ||
    "Location TBD";

  // Derive image from main_image or property photos
  const propertyPhotos = property?.photos as string[] | null;
  const image =
    (r.main_image as string) ||
    propertyPhotos?.[0] ||
    "";

  // Calculate duration from dates (parse as local to avoid timezone shift)
  let duration = "";
  if (r.start_date && r.end_date) {
    const [sy, sm, sd] = (r.start_date as string).split("T")[0].split("-").map(Number);
    const [ey, em, ed] = (r.end_date as string).split("T")[0].split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    duration = `${days} day${days !== 1 ? "s" : ""}`;
  }

  return {
    id: r.id as string,
    slug: (r.slug as string) || (r.id as string),
    title: r.title as string,
    category: ((t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : "Retreat")(r.retreat_type as string),
    description: r.description as string,
    longDescription: (r.what_you_offer as string) || undefined,
    location,
    venue: (r.custom_venue_name as string) || (property?.name as string) || undefined,
    duration,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    price: (r.ticket_price as number) || (r.price_per_person as number),
    ticketPrice: (r.ticket_price as number) || undefined,
    currency: "CAD",
    spotsTotal: (r.max_attendees as number) || undefined,
    image,
    galleryImages: (r.gallery_images as string[]) || [],
    galleryVideos: (r.gallery_videos as string[]) || [],
    hostId: (r.host_user_id as string) || undefined,
    sampleItinerary: (r.sample_itinerary as string) || undefined,
    amenities: (property?.amenities as string[]) || undefined,
    property: property
      ? {
          id: property.id as string,
          name: property.name as string,
          location: (property.location as string) || null,
          description: (property.description as string) || null,
          capacity: (property.capacity as number) || null,
          photos: (property.photos as string[]) || [],
          videos: (property.videos as string[]) || [],
          property_features: (property.property_features as string[]) || [],
          property_type: (property.property_type as string) || "venue",
        }
      : null,
  };
}

const RETREAT_SELECT = `
  id, slug, title, description, retreat_type, start_date, end_date,
  max_attendees, price_per_person, ticket_price, sample_itinerary, status,
  custom_venue_name, location_details, host_user_id, main_image, what_you_offer,
  gallery_images, gallery_videos,
  property:properties(id, name, location, description, capacity, photos, videos, property_features, property_type)
` as const;

export async function getFeaturedRetreats(limit = 2): Promise<Retreat[]> {
  try {
    const supabase = await createClient();
    // slug added via migration — cast to bypass generated types
    const { data, error } = await supabase
      .from("retreats")
      .select(RETREAT_SELECT)
      .eq("status", "published")
      .order("start_date", { ascending: true })
      .limit(limit) as { data: Record<string, unknown>[] | null; error: { message: string } | null };

    if (error || !data) return [];
    return data.map((row) => toRetreat(row));
  } catch {
    return [];
  }
}

export async function getRetreatCategories(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("retreats")
      .select("retreat_type")
      .eq("status", "published");

    if (error || !data) return [];
    return [...new Set(
      data
        .map((r) => r.retreat_type as string)
        .filter(Boolean)
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    )];
  } catch {
    return [];
  }
}

export async function getVenues(): Promise<VenueListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, property_type, capacity, amenities, description, photos, property_features")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((v) => ({
      id: v.id as string,
      name: v.name as string,
      location: (v.location as string) || null,
      property_type: (v.property_type as string) || "venue",
      capacity: (v.capacity as number) || null,
      amenities: (v.amenities as string[]) || [],
      description: (v.description as string) || null,
      image: ((v.photos as string[]) || [])[0] || "",
      property_features: (v.property_features as string[]) || [],
    }));
  } catch {
    return [];
  }
}

export async function getVenueById(id: string): Promise<VenueDetail | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, property_type, amenities, description, photos, videos, property_features, capacity, contact_name, contact_email, instagram_handle, tiktok_handle")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: d.id as string,
      name: d.name as string,
      location: (d.location as string) || null,
      property_type: (d.property_type as string) || "venue",
      amenities: (d.amenities as string[]) || [],
      description: (d.description as string) || null,
      photos: (d.photos as string[]) || [],
      videos: (d.videos as string[]) || [],
      property_features: (d.property_features as string[]) || [],
      capacity: (d.capacity as number) || null,
      contact_name: (d.contact_name as string) || null,
      contact_email: (d.contact_email as string) || null,
      instagram_handle: (d.instagram_handle as string) || null,
      tiktok_handle: (d.tiktok_handle as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getOwnProperty(id: string, userId: string): Promise<VenueDetail | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, property_type, amenities, description, photos, videos, property_features, capacity, contact_name, contact_email, instagram_handle, tiktok_handle, status")
      .eq("id", id)
      .eq("owner_user_id", userId)
      .single();

    if (error || !data) return null;
    const d = data as Record<string, unknown>;
    return {
      id: d.id as string,
      name: d.name as string,
      location: (d.location as string) || null,
      property_type: (d.property_type as string) || "venue",
      amenities: (d.amenities as string[]) || [],
      description: (d.description as string) || null,
      photos: (d.photos as string[]) || [],
      videos: (d.videos as string[]) || [],
      property_features: (d.property_features as string[]) || [],
      capacity: (d.capacity as number) || null,
      contact_name: (d.contact_name as string) || null,
      contact_email: (d.contact_email as string) || null,
      instagram_handle: (d.instagram_handle as string) || null,
      tiktok_handle: (d.tiktok_handle as string) || null,
      status: (d.status as string) || "draft",
    };
  } catch {
    return null;
  }
}

export async function getFeaturedVenues(limit = 2): Promise<VenuePreview[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, location, capacity, photos")
      .eq("status", "published")
      .limit(limit);

    if (error || !data) return [];
    return data.map((v) => ({
      id: v.id as string,
      name: v.name as string,
      location: (v.location as string) || null,
      capacity: (v.capacity as number) || null,
      image: ((v.photos as string[]) || [])[0] || "",
    }));
  } catch {
    return [];
  }
}

export async function getHeroSearchData(): Promise<HeroSearchData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("retreats")
      .select("retreat_type, custom_venue_name, start_date, property:properties(location)")
      .eq("status", "published");

    if (error || !data) return { categories: [], locations: [], months: [] };

    const categories = [
      ...new Set(
        data
          .map((r) => r.retreat_type as string)
          .filter(Boolean)
          .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      ),
    ];

    const locations = [
      ...new Set(
        data
          .map((r) => {
            const prop = r.property as Record<string, unknown> | null;
            return (r.custom_venue_name as string) || (prop?.location as string) || "";
          })
          .filter(Boolean)
      ),
    ];

    // Build months from actual start dates (future only)
    const now = new Date();
    const monthSet = new Map<string, string>();
    for (const r of data) {
      if (!r.start_date) continue;
      const d = parseLocalDate(r.start_date as string);
      if (d < now) continue;
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthSet.has(value)) {
        const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        monthSet.set(value, label);
      }
    }
    const months = [...monthSet.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));

    return { categories, locations, months };
  } catch {
    return { categories: [], locations: [], months: [] };
  }
}

export async function getMapRetreats(): Promise<MapRetreat[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("retreats")
      .select(RETREAT_SELECT)
      .eq("status", "published")
      .order("start_date", { ascending: true }) as { data: Record<string, unknown>[] | null; error: { message: string } | null };

    if (error || !data) return [];

    return data
      .map((row) => {
        const r = row;
        const retreat = toRetreat(r);
        const property = r.property as Record<string, unknown> | null;

        // Try geocoding multiple fields — property.location is most likely a real place
        const propertyLocation = (property?.location as string) || "";
        const customVenue = (r.custom_venue_name as string) || "";
        const coords =
          geocodeLocation(propertyLocation) ||
          geocodeLocation(customVenue) ||
          geocodeLocation(retreat.location);
        if (!coords) {
          console.log("[WorldMap] Could not geocode retreat:", retreat.title, {
            propertyLocation,
            customVenue,
            retreatLocation: retreat.location,
          });
          return null;
        }

        // Use property.location for display if available, otherwise retreat.location
        const displayLocation = propertyLocation || retreat.location;

        return {
          id: retreat.id,
          slug: retreat.slug,
          title: retreat.title,
          category: retreat.category,
          location: displayLocation,
          duration: retreat.duration,
          price: retreat.price,
          currency: retreat.currency,
          image: retreat.image,
          coordinates: coords,
        };
      })
      .filter((r): r is MapRetreat => r !== null);
  } catch {
    return [];
  }
}

export async function getRetreats(category?: string): Promise<Retreat[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("retreats")
      .select(RETREAT_SELECT)
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (category) {
      query = query.eq("retreat_type", category);
    }

    const { data, error } = await query as { data: Record<string, unknown>[] | null; error: { message: string } | null };

    if (error) {
      console.error("Error fetching retreats:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row) => toRetreat(row));
  } catch (e) {
    console.error("Exception fetching retreats:", e);
    return [];
  }
}

export async function getRetreatById(id: string): Promise<Retreat | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("retreats")
      .select(`*, property:properties(*)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error fetching retreat:", error?.message);
      return undefined;
    }

    return toRetreat(data as Record<string, unknown>);
  } catch (e) {
    console.error("Exception fetching retreat:", e);
    return undefined;
  }
}

export async function getRetreatBySlug(slug: string): Promise<Retreat | undefined> {
  try {
    const supabase = await createClient();
    // Try slug first, fall back to id if slug column doesn't exist yet
    const { data, error } = await supabase
      .from("retreats")
      .select(`*, property:properties(*)`)
      .eq("slug" as never, slug)
      .single() as { data: Record<string, unknown> | null; error: { message: string } | null };

    if (!error && data) return toRetreat(data);

    // Fallback: try as UUID (for old links or pre-migration)
    const { data: byId, error: idError } = await supabase
      .from("retreats")
      .select(`*, property:properties(*)`)
      .eq("id", slug)
      .single();

    if (idError || !byId) return undefined;
    return toRetreat(byId as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export async function getRetreatTeamMembers(retreatId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("retreat_team")
      .select("role, description, user_id, agreed")
      .eq("retreat_id" as never, retreatId)
      .eq("agreed" as never, true);

    if (error || !data) return [];

    // Fetch profiles for team members
    const userIds = (data as Record<string, unknown>[]).map((t) => t.user_id as string);
    const { data: profiles } = await supabase.rpc("get_public_profiles", {
      profile_ids: userIds,
    });

    const profileMap = new Map<string, Record<string, unknown>>();
    if (profiles) {
      for (const p of profiles as Record<string, unknown>[]) {
        profileMap.set(p.id as string, p);
      }
    }

    return (data as Record<string, unknown>[])
      .filter((t) => !["host", "venue"].includes(t.role as string)) // host shown separately, venue is not a person
      .map((t) => {
        const profile = profileMap.get(t.user_id as string);
        return {
          role: t.role as string,
          userId: t.user_id as string,
          name: profile ? (profile.name as string) || null : null,
          description: (t.description as string) || null,
          profilePhoto: profile ? (profile.profile_photo as string) || null : null,
        };
      });
  } catch {
    return [];
  }
}

export async function getProfilesByIds(userIds: string[]): Promise<HostProfileData[]> {
  if (userIds.length === 0) return [];
  try {
    const supabase = await createClient();
    const [{ data: profileData }, { data: rolesData }] = await Promise.all([
      supabase.rpc("get_public_profiles", { profile_ids: userIds }),
      supabase.from("user_roles").select("role, user_id").in("user_id", userIds),
    ]);

    if (!profileData) return [];

    const rolesByUser = new Map<string, string[]>();
    for (const r of (rolesData || []) as { role: string; user_id: string }[]) {
      if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
      rolesByUser.get(r.user_id)!.push(r.role);
    }

    return (profileData as Omit<HostProfileData, "user_roles">[]).map((p) => ({
      ...p,
      user_roles: rolesByUser.get(p.id) || [],
    }));
  } catch {
    return [];
  }
}

export async function getHostProfile(hostUserId: string): Promise<HostProfileData | null> {
  try {
    const supabase = await createClient();

    const [{ data: profileData, error }, { data: rolesData }] = await Promise.all([
      supabase.rpc("get_public_profiles", { profile_ids: [hostUserId] }),
      supabase.from("user_roles").select("role").eq("user_id", hostUserId),
    ]);

    if (error) {
      console.error("Error fetching host profile:", error.message);
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
export async function getOwnRetreat(retreatId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("retreats")
      .select("*")
      .eq("id", retreatId)
      .eq("host_user_id", user.id)
      .single();

    if (error || !data) return null;

    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      slug: (r.slug as string) || (r.id as string),
      title: (r.title as string) || "",
      description: (r.description as string) || "",
      retreat_type: (r.retreat_type as string) || "",
      start_date: (r.start_date as string) || "",
      end_date: (r.end_date as string) || "",
      property_id: (r.property_id as string) || null,
      custom_venue_name: (r.custom_venue_name as string) || "",
      location_details: (r.location_details as string) || "",
      max_attendees: (r.max_attendees as number) || null,
      price_per_person: (r.price_per_person as number) || null,
      what_you_offer: (r.what_you_offer as string) || "",
      what_to_bring: (r.what_to_bring as string) || "",
      sample_itinerary: (r.sample_itinerary as string) || "",
      main_image: (r.main_image as string) || null,
      gallery_images: (r.gallery_images as string[]) || [],
      gallery_videos: (r.gallery_videos as string[]) || [],
      status: (r.status as string) || "draft",
      created_at: r.created_at as string,
    };
  } catch {
    return null;
  }
}

export type { VenuePreview, HostProfileData };

