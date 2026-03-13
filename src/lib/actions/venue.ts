"use server";

import * as EmailValidator from "email-validator";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VenueFormData } from "@/lib/constants/venue";

const HANDLE_REGEX = /^[a-zA-Z0-9._]{1,50}$/;
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

function validateVenueDraft(data: VenueFormData): string | null {
  if (data.name.length > 100) return "Venue name must be 100 characters or fewer.";
  if (data.description.length > 5000) return "Description must be 5,000 characters or fewer.";
  if (data.location.length > 200) return "Location must be 200 characters or fewer.";
  if ((data.contact_name?.length ?? 0) > 100) return "Contact name must be 100 characters or fewer.";
  if (data.capacity !== null && data.capacity < 1) {
    return "Capacity must be at least 1.";
  }
  if (data.contact_email && !EmailValidator.validate(data.contact_email)) {
    return "Please enter a valid contact email.";
  }
  if (data.instagram_handle?.trim() && !HANDLE_REGEX.test(data.instagram_handle.trim())) {
    return "Instagram handle may only contain letters, numbers, periods, and underscores (max 50 characters).";
  }
  if (data.tiktok_handle?.trim() && !HANDLE_REGEX.test(data.tiktok_handle.trim())) {
    return "TikTok handle may only contain letters, numbers, periods, and underscores (max 50 characters).";
  }
  if ((data.photos || []).some((url) => !validateMediaUrl(url, false))) {
    return "One or more photo URLs are invalid.";
  }
  if ((data.videos || []).some((url) => !validateMediaUrl(url, true))) {
    return "One or more video URLs are invalid.";
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

export async function createProperty(
  data: VenueFormData
): Promise<{ id: string } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const validationError = validateVenueDraft(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      owner_user_id: userId,
      name: data.name.trim(),
      property_type: data.property_type,
      description: data.description.trim(),
      location: data.location.trim(),
      capacity: data.capacity,
      amenities: data.amenities || [],
      property_features: data.property_features || [],
      photos: data.photos || [],
      videos: data.videos || [],
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      instagram_handle: data.instagram_handle.trim() || null,
      tiktok_handle: data.tiktok_handle.trim() || null,
      status: "draft",
    } as never)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { id: (property as { id: string }).id };
}

export async function updateProperty(
  propertyId: string,
  data: VenueFormData
): Promise<{ error: string | null; statusChanged?: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const validationError = validateVenueDraft(data);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("properties")
    .select("owner_user_id, status")
    .eq("id", propertyId)
    .single();

  if (fetchError || !existing) return { error: "Property not found." };
  if ((existing as { owner_user_id: string }).owner_user_id !== userId)
    return { error: "Not authorized." };

  const currentStatus = (existing as { status: string }).status;
  const wasPublished = currentStatus === "published";

  const updateData: Record<string, unknown> = {
    name: data.name.trim(),
    property_type: data.property_type,
    description: data.description.trim(),
    location: data.location.trim(),
    capacity: data.capacity,
    amenities: data.amenities || [],
    property_features: data.property_features || [],
    photos: data.photos || [],
    videos: data.videos || [],
    contact_name: data.contact_name.trim() || null,
    contact_email: data.contact_email.trim() || null,
    instagram_handle: data.instagram_handle.trim() || null,
    tiktok_handle: data.tiktok_handle.trim() || null,
  };

  if (wasPublished) {
    updateData.status = "pending_review";
  }

  const { data: updated, error } = await supabase
    .from("properties")
    .update(updateData)
    .eq("id", propertyId)
    .eq("owner_user_id", userId)
    .eq("status", currentStatus)
    .select("id");

  if (error) return { error: error.message };
  if (!updated?.length) return { error: "Property was modified by another request. Please refresh and try again." };

  revalidatePath("/dashboard");
  revalidatePath(`/venues/${propertyId}/edit`);
  revalidatePath(`/venues/${propertyId}`);
  return { error: null, statusChanged: wasPublished };
}

export async function submitPropertyForReview(
  propertyId: string
): Promise<{ error: string | null; isFirstTime: boolean }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated", isFirstTime: false };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("properties")
    .select("owner_user_id, status, name, description, location, property_type")
    .eq("id", propertyId)
    .single();

  if (fetchError || !existing) return { error: "Property not found.", isFirstTime: false };
  const p = existing as Record<string, unknown>;
  if (p.owner_user_id !== userId) return { error: "Not authorized.", isFirstTime: false };

  const status = p.status as string;
  if (status !== "draft" && status !== "pending_review") {
    return { error: `Cannot submit a property with status "${status}".`, isFirstTime: false };
  }

  if (!p.name || !p.description || !p.location || !p.property_type) {
    return { error: "Please fill in all required fields before submitting.", isFirstTime: false };
  }

  const { error } = await supabase
    .from("properties")
    .update({ status: "pending_review" })
    .eq("id", propertyId);

  if (error) return { error: error.message, isFirstTime: false };

  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId)
    .eq("status", "published");

  revalidatePath("/dashboard");
  return { error: null, isFirstTime: !count || count === 0 };
}

export async function deleteProperty(
  propertyId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("properties")
    .select("owner_user_id, status")
    .eq("id", propertyId)
    .single();

  if (fetchError || !existing) return { error: "Property not found." };
  const p = existing as Record<string, unknown>;
  if (p.owner_user_id !== userId) return { error: "Not authorized." };

  const status = p.status as string;
  if (status !== "draft" && status !== "pending_review") {
    return {
      error:
        "Only draft or pending review properties can be deleted. Published properties must be unpublished first.",
    };
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
