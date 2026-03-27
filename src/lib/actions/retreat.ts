"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RetreatFormData } from "@/lib/constants/retreat";
import { deleteStorageUrl, deleteStorageUrls, cleanupRemovedUrls } from "@/lib/utils/storage";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

function validateMediaUrl(url: string, isVideo: boolean): boolean {
  try {
    const parsed = new URL(url);
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    if (parsed.hostname !== supabaseHost) return false;
    const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";
    return isVideo ? VIDEO_EXTS.has(ext) : IMAGE_EXTS.has(ext);
  } catch {
    return false;
  }
}

function validateRetreatDraft(data: RetreatFormData): string | null {
  if (data.title.length > 150) return "Title must be 150 characters or fewer.";
  if (data.description.length > 5000) return "Description must be 5,000 characters or fewer.";
  if (data.start_date && data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
    return "End date must be after start date.";
  }
  if (data.custom_venue_name.length > 200) return "Venue name must be 200 characters or fewer.";
  if ((data.location_details?.length ?? 0) > 300) return "Location details must be 300 characters or fewer.";
  if ((data.what_you_offer?.length ?? 0) > 3000) return "What you offer must be 3,000 characters or fewer.";
  if ((data.what_to_bring?.length ?? 0) > 2000) return "What to bring must be 2,000 characters or fewer.";
  if ((data.sample_itinerary?.length ?? 0) > 10000) return "Sample itinerary must be 10,000 characters or fewer.";
  if (data.price_per_person != null && data.price_per_person < 0) {
    return "Price cannot be negative.";
  }
  if (data.max_attendees != null && data.max_attendees < 1) {
    return "Max attendees must be at least 1.";
  }
  if (data.main_image && !validateMediaUrl(data.main_image, false)) {
    return "Main image URL is invalid.";
  }
  if ((data.gallery_images || []).some((url) => !validateMediaUrl(url, false))) {
    return "One or more gallery image URLs are invalid.";
  }
  if ((data.gallery_videos || []).some((url) => !validateMediaUrl(url, true))) {
    return "One or more gallery video URLs are invalid.";
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

  const validationError = validateRetreatDraft(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: retreat, error } = await supabase
    .from("retreats")
    .insert({
      host_user_id: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      retreat_type: data.retreat_type || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      property_id: data.property_id || null,
      custom_venue_name: data.custom_venue_name.trim(),
      location_details: data.location_details.trim() || null,
      max_attendees: data.max_attendees,
      price_per_person: data.price_per_person,
      what_you_offer: data.what_you_offer.trim() || null,
      what_to_bring: data.what_to_bring.trim() || null,
      sample_itinerary: data.sample_itinerary.trim() || null,
      main_image: data.main_image || null,
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

  const validationError = validateRetreatDraft(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  // Verify ownership and get current status + existing media
  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status, main_image, gallery_images, gallery_videos")
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
    retreat_type: data.retreat_type || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    property_id: data.property_id || null,
    custom_venue_name: data.custom_venue_name.trim(),
    location_details: data.location_details.trim() || null,
    max_attendees: data.max_attendees,
    price_per_person: data.price_per_person,
    what_you_offer: data.what_you_offer.trim() || null,
    what_to_bring: data.what_to_bring.trim() || null,
    sample_itinerary: data.sample_itinerary.trim() || null,
    main_image: data.main_image || null,
    gallery_images: data.gallery_images || [],
    gallery_videos: data.gallery_videos || [],
    allow_donations: data.allow_donations,
    looking_for: data.looking_for || { needs: [], notes: {} },
  };

  // If published/full, push back to pending_review and lock price
  if (wasPublished) {
    updateData.status = "pending_review";
    delete updateData.price_per_person;
  }

  const { data: updated, error } = await supabase
    .from("retreats")
    .update(updateData)
    .eq("id", retreatId)
    .eq("host_user_id", userId)
    .eq("status", existing.status!)
    .select("id");

  if (error) return { error: error.message };
  if (!updated?.length) return { error: "Retreat was modified by another request. Please refresh and try again." };

  // Clean up removed media from storage (fire-and-forget)
  const oldMainImage = (existing as Record<string, unknown>).main_image as string | null;
  const oldImages = ((existing as Record<string, unknown>).gallery_images as string[]) || [];
  const oldVideos = ((existing as Record<string, unknown>).gallery_videos as string[]) || [];
  const newMainImage = data.main_image || null;

  const cleanupPromises: Promise<void>[] = [];
  if (oldMainImage && oldMainImage !== newMainImage) {
    cleanupPromises.push(deleteStorageUrl(oldMainImage));
  }
  cleanupPromises.push(cleanupRemovedUrls(oldImages, data.gallery_images || []));
  cleanupPromises.push(cleanupRemovedUrls(oldVideos, data.gallery_videos || []));
  Promise.all(cleanupPromises).catch(() => {});

  revalidatePath("/dashboard");
  revalidatePath(`/host/retreats/${retreatId}/edit`);
  return { error: null, statusChanged: wasPublished };
}

export async function submitRetreatForReview(
  retreatId: string
): Promise<{ error: string | null; isFirstTime: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated", isFirstTime: false };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status, title, description, start_date, end_date, custom_venue_name, property_id, retreat_type")
    .eq("id", retreatId)
    .single();

  if (fetchError || !existing) return { error: "Retreat not found.", isFirstTime: false };
  if (existing.host_user_id !== userId) return { error: "Not authorized.", isFirstTime: false };

  const status = existing.status as string;
  if (status !== "draft" && status !== "pending_review") {
    return { error: `Cannot submit a retreat with status "${status}".`, isFirstTime: false };
  }

  // Profile completeness check
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, bio, location, profile_photo, expertise_areas, languages, years_experience, what_i_offer, what_im_looking_for, availability_status, instagram_handle, tiktok_handle, website_url")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { error: "Profile not found.", isFirstTime: false };
  }

  const p = profile as Record<string, unknown>;
  if (
    !p.name || !p.bio || !p.location || !p.profile_photo ||
    !(p.expertise_areas as string[] | null)?.length ||
    !(p.languages as string[] | null)?.length ||
    p.years_experience == null ||
    !p.what_i_offer || !p.what_im_looking_for || !p.availability_status ||
    !p.instagram_handle || !p.tiktok_handle || !p.website_url
  ) {
    return { error: "Please complete your profile before submitting a retreat. Go to My Profile to fill in all required fields.", isFirstTime: false };
  }

  // Basic completeness check
  if (!existing.title || !existing.description || !existing.start_date || !existing.end_date || (!existing.custom_venue_name && !existing.property_id) || !existing.retreat_type) {
    return { error: "Please fill in all required fields before submitting.", isFirstTime: false };
  }

  const { error } = await supabase
    .from("retreats")
    .update({ status: "pending_review" })
    .eq("id", retreatId);

  if (error) return { error: error.message, isFirstTime: false };

  const { count } = await supabase
    .from("retreats")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", userId)
    .in("status", ["approved", "published", "full", "completed"]);

  revalidatePath("/dashboard");
  return { error: null, isFirstTime: !count || count === 0 };
}

export async function deleteRetreat(
  retreatId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("retreats")
    .select("host_user_id, status, main_image, gallery_images, gallery_videos")
    .eq("id", retreatId)
    .single();

  if (fetchError || !existing) return { error: "Retreat not found." };
  if (existing.host_user_id !== userId) return { error: "Not authorized." };

  const status = existing.status as string;
  if (status !== "draft" && status !== "pending_review" && status !== "cancelled") {
    return { error: "Only draft, pending review, or cancelled retreats can be deleted. Published retreats must be unpublished first." };
  }

  // Collect all media URLs to delete from storage
  const row = existing as Record<string, unknown>;
  const allMedia: string[] = [];
  if (row.main_image) allMedia.push(row.main_image as string);
  if (row.gallery_images) allMedia.push(...(row.gallery_images as string[]));
  if (row.gallery_videos) allMedia.push(...(row.gallery_videos as string[]));

  const { error } = await supabase
    .from("retreats")
    .delete()
    .eq("id", retreatId);

  if (error) return { error: error.message };

  // Clean up storage after successful DB delete
  deleteStorageUrls(allMedia).catch(() => {});

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
