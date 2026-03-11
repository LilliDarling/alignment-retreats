"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VenueFormData } from "@/lib/constants/venue";

function validateVenue(data: VenueFormData): string | null {
  if (!data.name.trim()) return "Venue name is required.";
  if (!data.property_type) return "Property type is required.";
  if (!data.description.trim()) return "Description is required.";
  if (!data.location.trim()) return "Location is required.";
  if (data.capacity !== null && data.capacity < 1) {
    return "Capacity must be at least 1.";
  }
  if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    return "Please enter a valid contact email.";
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

  const validationError = validateVenue(data);
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

  const validationError = validateVenue(data);
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

  const { error } = await supabase
    .from("properties")
    .update(updateData)
    .eq("id", propertyId);

  if (error) return { error: error.message };

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
