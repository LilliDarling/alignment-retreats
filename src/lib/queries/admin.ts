import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────
export interface AdminMember {
  id: string;
  name: string | null;
  email: string;
  created_at: string | null;
  roles: string[];
  slug: string | null;
}

export interface LookingForData {
  needs: string[];
  notes: Record<string, string>;
}

export interface PendingRetreat {
  id: string;
  title: string;
  description: string;
  retreat_type: string;
  start_date: string;
  end_date: string;
  custom_venue_name: string | null;
  location_details: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  what_you_offer: string | null;
  what_to_bring: string | null;
  sample_itinerary: string | null;
  main_image: string | null;
  gallery_images: string[];
  gallery_videos: string[];
  allow_donations: boolean;
  looking_for: LookingForData;
  status: string;
  created_at: string;
  host_user_id: string;
  host_name: string | null;
  host_email: string | null;
  host_photo: string | null;
  property_id: string | null;
  property_name: string | null;
}

export interface ApprovedRetreat {
  id: string;
  title: string;
  retreat_type: string;
  start_date: string;
  end_date: string;
  custom_venue_name: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  looking_for: LookingForData;
  status: string;
  host_name: string | null;
  host_email: string | null;
  team_members: TeamMemberInfo[];
}

export interface TeamMemberInfo {
  id: string;
  user_id: string;
  role: string;
  fee_type: string;
  fee_amount: number;
  description: string | null;
  agreed: boolean;
  member_name: string | null;
}

export interface PublishedRetreat {
  id: string;
  title: string;
  retreat_type: string;
  start_date: string;
  end_date: string;
  custom_venue_name: string | null;
  ticket_price: number | null;
  expected_attendees: number | null;
  max_attendees: number | null;
  price_per_person: number | null;
  status: string;
  host_name: string | null;
  host_email: string | null;
  team_members: TeamMemberInfo[];
}

export interface PendingProperty {
  id: string;
  name: string;
  property_type: string;
  location: string | null;
  capacity: number | null;
  description: string | null;
  amenities: string[];
  photos: string[];
  videos: string[];
  status: string;
  created_at: string;
  owner_user_id: string;
  owner_name: string | null;
  owner_email: string | null;
  contact_name: string | null;
  contact_email: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  property_features: string[];
}

export interface PublishedProperty {
  id: string;
  name: string;
  property_type: string;
  location: string | null;
  capacity: number | null;
  photos: string[];
  status: string;
  owner_name: string | null;
  owner_email: string | null;
  contact_name: string | null;
  contact_email: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
  resolved: boolean;
  archived: boolean;
}

export interface RevenueMetrics {
  pipelineValue: number;
  hostWealthIndex: number;
  totalRetreats: number;
  uniqueHosts: number;
  pendingSubmissions: number;
  pendingProperties: number;
  publishedProperties: number;
  approvedRetreats: number;
  publishedRetreats: number;
  contactSubmissions: number;
}

export interface AdminDashboardData {
  members: AdminMember[];
  pendingRetreats: PendingRetreat[];
  approvedRetreats: ApprovedRetreat[];
  publishedRetreats: PublishedRetreat[];
  pendingProperties: PendingProperty[];
  publishedProperties: PublishedProperty[];
  contactSubmissions: ContactSubmission[];
  metrics: RevenueMetrics;
}

// ─── Queries ─────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [members, pendingRetreats, approvedRetreats, publishedRetreats, pendingProperties, publishedProperties, contactSubmissions, metrics] =
    await Promise.all([
      getMembers(),
      getPendingRetreats(),
      getApprovedRetreats(),
      getPublishedRetreats(),
      getPendingProperties(),
      getPublishedProperties(),
      getContactSubmissions(),
      getRevenueMetrics(),
    ]);

  return { members, pendingRetreats, approvedRetreats, publishedRetreats, pendingProperties, publishedProperties, contactSubmissions, metrics };
}

async function getMembers(): Promise<AdminMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_all_profiles_admin");

  if (error) {
    console.error("getMembers RPC error:", error.message);
    return [];
  }
  if (!data) return [];

  return (data as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    name: (p.name as string) || null,
    email: (p.email as string) || "",
    created_at: (p.created_at as string) || null,
    roles: (p.roles as string[]) || [],
    slug: (p.slug as string) || null,
  }));
}

async function getPendingRetreats(): Promise<PendingRetreat[]> {
  const supabase = await createClient();

  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  if (error || !retreats) return [];

  // Fetch host profiles
  const hostIds = [
    ...new Set(retreats.map((r) => (r as Record<string, unknown>).host_user_id as string)),
  ];

  const { data: profiles } = await supabase.rpc("get_all_profiles_admin");
  const profileMap = new Map<string, Record<string, unknown>>();
  if (profiles) {
    for (const p of profiles as Record<string, unknown>[]) {
      profileMap.set(p.id as string, p);
    }
  }

  return retreats.map((r) => {
    const row = r as Record<string, unknown>;
    const host = profileMap.get(row.host_user_id as string);
    return {
      id: row.id as string,
      title: (row.title as string) || "",
      description: (row.description as string) || "",
      retreat_type: (row.retreat_type as string) || "",
      start_date: (row.start_date as string) || "",
      end_date: (row.end_date as string) || "",
      custom_venue_name: (row.custom_venue_name as string) || null,
      location_details: (row.location_details as string) || null,
      max_attendees: (row.max_attendees as number) || null,
      price_per_person: (row.price_per_person as number) || null,
      what_you_offer: (row.what_you_offer as string) || null,
      what_to_bring: (row.what_to_bring as string) || null,
      sample_itinerary: (row.sample_itinerary as string) || null,
      main_image: (row.main_image as string) || null,
      gallery_images: (row.gallery_images as string[]) || [],
      gallery_videos: (row.gallery_videos as string[]) || [],
      allow_donations: (row.allow_donations as boolean) || false,
      looking_for: (row.looking_for as LookingForData) || { needs: [], notes: {} },
      status: (row.status as string) || "pending_review",
      created_at: (row.created_at as string) || "",
      host_user_id: (row.host_user_id as string) || "",
      host_name: host ? (host.name as string) || null : null,
      host_email: host ? (host.email as string) || null : null,
      host_photo: null,
      property_id: (row.property_id as string) || null,
      property_name: null,
    };
  });
}

async function getApprovedRetreats(): Promise<ApprovedRetreat[]> {
  const supabase = await createClient();

  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !retreats) return [];

  // Fetch host profiles
  const { data: profiles } = await supabase.rpc("get_all_profiles_admin");
  const profileMap = new Map<string, Record<string, unknown>>();
  if (profiles) {
    for (const p of profiles as Record<string, unknown>[]) {
      profileMap.set(p.id as string, p);
    }
  }

  // Fetch team members for all approved retreats
  const retreatIds = retreats.map((r) => (r as Record<string, unknown>).id as string);
  const { data: teamData } = await supabase
    .from("retreat_team")
    .select("*")
    .in("retreat_id", retreatIds);

  const teamByRetreat = new Map<string, TeamMemberInfo[]>();
  if (teamData) {
    for (const t of teamData as Record<string, unknown>[]) {
      const retreatId = t.retreat_id as string;
      if (!teamByRetreat.has(retreatId)) teamByRetreat.set(retreatId, []);
      const memberProfile = profileMap.get(t.user_id as string);
      teamByRetreat.get(retreatId)!.push({
        id: t.id as string,
        user_id: t.user_id as string,
        role: t.role as string,
        fee_type: t.fee_type as string,
        fee_amount: (t.fee_amount as number) || 0,
        description: (t.description as string) || null,
        agreed: (t.agreed as boolean) || false,
        member_name: memberProfile ? (memberProfile.name as string) || null : null,
      });
    }
  }

  return retreats.map((r) => {
    const row = r as Record<string, unknown>;
    const host = profileMap.get(row.host_user_id as string);
    return {
      id: row.id as string,
      title: (row.title as string) || "",
      retreat_type: (row.retreat_type as string) || "",
      start_date: (row.start_date as string) || "",
      end_date: (row.end_date as string) || "",
      custom_venue_name: (row.custom_venue_name as string) || null,
      max_attendees: (row.max_attendees as number) || null,
      price_per_person: (row.price_per_person as number) || null,
      looking_for: (row.looking_for as LookingForData) || { needs: [], notes: {} },
      status: (row.status as string) || "approved",
      host_name: host ? (host.name as string) || null : null,
      host_email: host ? (host.email as string) || null : null,
      team_members: teamByRetreat.get(row.id as string) || [],
    };
  });
}

async function getPublishedRetreats(): Promise<PublishedRetreat[]> {
  const supabase = await createClient();

  const { data: retreats, error } = await supabase
    .from("retreats")
    .select("*")
    .in("status", ["published", "full"])
    .order("start_date", { ascending: true });

  if (error || !retreats) return [];

  const { data: profiles } = await supabase.rpc("get_all_profiles_admin");
  const profileMap = new Map<string, Record<string, unknown>>();
  if (profiles) {
    for (const p of profiles as Record<string, unknown>[]) {
      profileMap.set(p.id as string, p);
    }
  }

  // Fetch team members for all published retreats
  const retreatIds = retreats.map((r) => (r as Record<string, unknown>).id as string);
  const { data: teamData } = await supabase
    .from("retreat_team")
    .select("*")
    .in("retreat_id", retreatIds);

  const teamByRetreat = new Map<string, TeamMemberInfo[]>();
  if (teamData) {
    for (const t of teamData as Record<string, unknown>[]) {
      const retreatId = t.retreat_id as string;
      if (!teamByRetreat.has(retreatId)) teamByRetreat.set(retreatId, []);
      const memberProfile = profileMap.get(t.user_id as string);
      teamByRetreat.get(retreatId)!.push({
        id: t.id as string,
        user_id: t.user_id as string,
        role: t.role as string,
        fee_type: t.fee_type as string,
        fee_amount: (t.fee_amount as number) || 0,
        description: (t.description as string) || null,
        agreed: (t.agreed as boolean) || false,
        member_name: memberProfile ? (memberProfile.name as string) || null : null,
      });
    }
  }

  return retreats.map((r) => {
    const row = r as Record<string, unknown>;
    const host = profileMap.get(row.host_user_id as string);
    return {
      id: row.id as string,
      title: (row.title as string) || "",
      retreat_type: (row.retreat_type as string) || "",
      start_date: (row.start_date as string) || "",
      end_date: (row.end_date as string) || "",
      custom_venue_name: (row.custom_venue_name as string) || null,
      ticket_price: (row.ticket_price as number) || null,
      expected_attendees: (row.expected_attendees as number) || null,
      max_attendees: (row.max_attendees as number) || null,
      price_per_person: (row.price_per_person as number) || null,
      status: (row.status as string) || "published",
      host_name: host ? (host.name as string) || null : null,
      host_email: host ? (host.email as string) || null : null,
      team_members: teamByRetreat.get(row.id as string) || [],
    };
  });
}

async function getPendingProperties(): Promise<PendingProperty[]> {
  const supabase = await createClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  if (error || !properties) return [];

  const { data: profiles } = await supabase.rpc("get_all_profiles_admin");
  const profileMap = new Map<string, Record<string, unknown>>();
  if (profiles) {
    for (const p of profiles as Record<string, unknown>[]) {
      profileMap.set(p.id as string, p);
    }
  }

  return properties.map((p) => {
    const row = p as Record<string, unknown>;
    const owner = profileMap.get(row.owner_user_id as string);
    return {
      id: row.id as string,
      name: (row.name as string) || "",
      property_type: (row.property_type as string) || "",
      location: (row.location as string) || null,
      capacity: (row.capacity as number) || null,
      description: (row.description as string) || null,
      base_price: (row.base_price as number) || null,
      amenities: (row.amenities as string[]) || [],
      photos: (row.photos as string[]) || [],
      videos: (row.videos as string[]) || [],
      status: (row.status as string) || "pending_review",
      created_at: (row.created_at as string) || "",
      owner_user_id: (row.owner_user_id as string) || "",
      owner_name: owner ? (owner.name as string) || null : null,
      owner_email: owner ? (owner.email as string) || null : null,
      contact_name: (row.contact_name as string) || null,
      contact_email: (row.contact_email as string) || null,
      instagram_handle: (row.instagram_handle as string) || null,
      tiktok_handle: (row.tiktok_handle as string) || null,
      property_features: (row.property_features as string[]) || [],
    };
  });
}

async function getPublishedProperties(): Promise<PublishedProperty[]> {
  const supabase = await createClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !properties) return [];

  const { data: profiles } = await supabase.rpc("get_all_profiles_admin");
  const profileMap = new Map<string, Record<string, unknown>>();
  if (profiles) {
    for (const p of profiles as Record<string, unknown>[]) {
      profileMap.set(p.id as string, p);
    }
  }

  return properties.map((p) => {
    const row = p as Record<string, unknown>;
    const owner = profileMap.get(row.owner_user_id as string);
    return {
      id: row.id as string,
      name: (row.name as string) || "",
      property_type: (row.property_type as string) || "",
      location: (row.location as string) || null,
      capacity: (row.capacity as number) || null,
      photos: (row.photos as string[]) || [],
      status: (row.status as string) || "published",
      owner_name: owner ? (owner.name as string) || null : null,
      owner_email: owner ? (owner.email as string) || null : null,
      contact_name: (row.contact_name as string) || null,
      contact_email: (row.contact_email as string) || null,
      instagram_handle: (row.instagram_handle as string) || null,
      tiktok_handle: (row.tiktok_handle as string) || null,
    };
  });
}

async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("contact_submissions")
    .select("id, name, email, subject, message, created_at, read, resolved, archived")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: (r.name as string) || "",
    email: (r.email as string) || "",
    subject: (r.subject as string) || "",
    message: (r.message as string) || "",
    created_at: (r.created_at as string) || "",
    read: (r.read as boolean) || false,
    resolved: (r.resolved as boolean) || false,
    archived: (r.archived as boolean) || false,
  }));
}

async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = await createClient();

  const [retreatsResult, pendingRetreatsResult, approvedRetreatsResult, publishedRetreatsResult, pendingPropsResult, publishedPropsResult, contactResult] =
    await Promise.all([
      supabase
        .from("retreats")
        .select("price_per_person, max_attendees, host_user_id"),
      supabase
        .from("retreats")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("retreats")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("retreats")
        .select("id", { count: "exact", head: true })
        .in("status", ["published", "full"]),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("contact_submissions")
        .select("id", { count: "exact", head: true }),
    ]);

  const retreats = (retreatsResult.data || []) as Record<string, unknown>[];

  const pipelineValue = retreats.reduce((sum, r) => {
    const price = (r.price_per_person as number) || 0;
    const attendees = (r.max_attendees as number) || 10;
    return sum + price * attendees;
  }, 0);

  const uniqueHosts = new Set(retreats.map((r) => r.host_user_id)).size;
  const hostWealthIndex = uniqueHosts > 0 ? pipelineValue / uniqueHosts : 0;

  return {
    pipelineValue,
    hostWealthIndex,
    totalRetreats: retreats.length,
    uniqueHosts,
    pendingSubmissions: pendingRetreatsResult.count || 0,
    pendingProperties: pendingPropsResult.count || 0,
    publishedProperties: publishedPropsResult.count || 0,
    approvedRetreats: approvedRetreatsResult.count || 0,
    publishedRetreats: publishedRetreatsResult.count || 0,
    contactSubmissions: contactResult.count || 0,
  };
}
