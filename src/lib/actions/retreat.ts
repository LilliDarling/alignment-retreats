"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RetreatFormData } from "@/lib/constants/retreat";

function validateRetreat(data: RetreatFormData): string | null {
  if (!data.title.trim()) return "Title is required.";
  if (!data.description.trim()) return "Description is required.";
  if (!data.retreat_type) return "Retreat type is required.";
  if (!data.start_date) return "Start date is required.";
  if (!data.end_date) return "End date is required.";
  if (new Date(data.end_date) <= new Date(data.start_date)) {
    return "End date must be after start date.";
  }
  if (!data.property_id && !data.custom_venue_name.trim()) return "Please select a venue or enter a custom location.";
  if (data.price_per_person != null && data.price_per_person < 0) {
    return "Price cannot be negative.";
  }
  if (data.max_attendees != null && data.max_attendees < 1) {
    return "Max attendees must be at least 1.";
  }
  return null;
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createRetreat(
  data: RetreatFormData
): Promise<{ id: string } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const validationError = validateRetreat(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: retreat, error } = await supabase
    .from("retreats")
    .insert({
      host_user_id: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      retreat_type: data.retreat_type,
      start_date: data.start_date,
      end_date: data.end_date,
      property_id: data.property_id || null,
      custom_venue_name: data.custom_venue_name.trim(),
      location_details: data.location_details.trim() || null,
      max_attendees: data.max_attendees,
      price_per_person: data.price_per_person,
      what_you_offer: data.what_you_offer.trim() || null,
      what_to_bring: data.what_to_bring.trim() || null,
      sample_itinerary: data.sample_itinerary.trim() || null,
      main_image: data.main_image,
      gallery_images: data.gallery_images || [],
      gallery_videos: data.gallery_videos || [],
      allow_donations: data.allow_donations,
      looking_for: data.looking_for || { needs: [], notes: {} },
      status: "draft",
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { id: retreat.id };
}

export async function updateRetreat(
  retreatId: string,
  data: RetreatFormData
): Promise<{ error: string | null; statusChanged?: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const validationError = validateRetreat(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  // Verify ownership and get current status
  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status")
    .eq("id", retreatId)
    .single();

  if (fetchError || !existing) return { error: "Retreat not found." };
  if (existing.host_user_id !== userId) return { error: "Not authorized." };

  const currentStatus = existing.status as string;
  const wasPublished =
    currentStatus === "published" || currentStatus === "full";

  // Build update payload
  const updateData: Record<string, unknown> = {
    title: data.title.trim(),
    description: data.description.trim(),
    retreat_type: data.retreat_type,
    start_date: data.start_date,
    end_date: data.end_date,
    property_id: data.property_id || null,
    custom_venue_name: data.custom_venue_name.trim(),
    location_details: data.location_details.trim() || null,
    max_attendees: data.max_attendees,
    price_per_person: data.price_per_person,
    what_you_offer: data.what_you_offer.trim() || null,
    what_to_bring: data.what_to_bring.trim() || null,
    sample_itinerary: data.sample_itinerary.trim() || null,
    main_image: data.main_image,
    gallery_images: data.gallery_images || [],
    gallery_videos: data.gallery_videos || [],
    allow_donations: data.allow_donations,
    looking_for: data.looking_for || { needs: [], notes: {} },
  };

  // If published/full, push back to pending_review
  if (wasPublished) {
    updateData.status = "pending_review";
  }

  const { error } = await supabase
    .from("retreats")
    .update(updateData)
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/host/retreats/${retreatId}/edit`);
  return { error: null, statusChanged: wasPublished };
}

export async function submitRetreatForReview(
  retreatId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status, title, description, start_date, end_date, custom_venue_name, property_id, retreat_type")
    .eq("id", retreatId)
    .single();

  if (fetchError || !existing) return { error: "Retreat not found." };
  if (existing.host_user_id !== userId) return { error: "Not authorized." };

  const status = existing.status as string;
  if (status !== "draft" && status !== "pending_review") {
    return { error: `Cannot submit a retreat with status "${status}".` };
  }

  // Basic completeness check
  if (!existing.title || !existing.description || !existing.start_date || !existing.end_date || (!existing.custom_venue_name && !existing.property_id) || !existing.retreat_type) {
    return { error: "Please fill in all required fields before submitting." };
  }

  const { error } = await supabase
    .from("retreats")
    .update({ status: "pending_review" })
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteRetreat(
  retreatId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status")
    .eq("id", retreatId)
    .single();

  if (fetchError || !existing) return { error: "Retreat not found." };
  if (existing.host_user_id !== userId) return { error: "Not authorized." };

  const status = existing.status as string;
  if (status !== "draft" && status !== "pending_review") {
    return { error: "Only draft or pending review retreats can be deleted. Published retreats must be unpublished first." };
  }

  const { error } = await supabase
    .from("retreats")
    .delete()
    .eq("id", retreatId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getPublishedVenues(): Promise<
  { id: string; name: string; location: string | null; capacity: number | null; description: string | null }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, location, capacity, description")
    .eq("status", "published")
    .order("name");

  if (error || !data) return [];
  return data.map((v) => ({
    id: v.id as string,
    name: v.name as string,
    location: (v.location as string) || null,
    capacity: (v.capacity as number) || null,
    description: (v.description as string) || null,
  }));
}
