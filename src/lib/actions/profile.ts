"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  EditableProfile,
  BasicInfoUpdate,
  ProfessionalUpdate,
  SocialLinksUpdate,
  AboutUpdate,
  RatesUpdate,
  PortfolioUpdate,
} from "@/types/profile";

const PROFILE_SELECT = `
  id, name, slug, bio, profile_photo, cover_photo, location,
  expertise_areas, certifications, languages, years_experience,
  availability_status, what_i_offer, what_im_looking_for,
  instagram_handle, tiktok_handle, website_url,
  portfolio_photos, portfolio_videos,
  rate, rate_currency,
  travel_willing, show_in_directory, profile_completed
` as const;

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getOwnProfile(): Promise<EditableProfile | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = await createClient();
  // slug column added via migration — cast to bypass generated types until they're regenerated
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .single() as { data: Record<string, unknown> | null; error: { message: string } | null };

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string | null,
    slug: (data.slug as string) || "",
    bio: data.bio as string | null,
    profile_photo: data.profile_photo as string | null,
    cover_photo: data.cover_photo as string | null,
    location: data.location as string | null,
    expertise_areas: data.expertise_areas as string[] | null,
    certifications: data.certifications as string[] | null,
    languages: data.languages as string[] | null,
    years_experience: data.years_experience as number | null,
    availability_status: data.availability_status as string | null,
    what_i_offer: data.what_i_offer as string | null,
    what_im_looking_for: data.what_im_looking_for as string | null,
    instagram_handle: data.instagram_handle as string | null,
    tiktok_handle: data.tiktok_handle as string | null,
    website_url: data.website_url as string | null,
    portfolio_photos: data.portfolio_photos as string[] | null,
    portfolio_videos: data.portfolio_videos as string[] | null,
    rate: data.rate as number | null,
    rate_currency: data.rate_currency as string | null,
    travel_willing: (data.travel_willing as boolean) || false,
    show_in_directory: (data.show_in_directory as boolean) || false,
    profile_completed: (data.profile_completed as boolean) || false,
  };
}

async function updateProfileFields(
  fields: Record<string, unknown>
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateBasicInfo(data: BasicInfoUpdate) {
  if (data.name && data.name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (data.bio && data.bio.length > 1000) return { error: "Bio must be 1,000 characters or fewer." };
  if (data.location && data.location.length > 200) return { error: "Location must be 200 characters or fewer." };
  return updateProfileFields({ ...data });
}

export async function updateProfessional(data: ProfessionalUpdate) {
  return updateProfileFields({ ...data });
}

const HANDLE_REGEX = /^[a-zA-Z0-9._]{1,50}$/;

export async function updateSocialLinks(data: SocialLinksUpdate) {
  if (data.instagram_handle && !HANDLE_REGEX.test(data.instagram_handle)) {
    return { error: "Instagram handle may only contain letters, numbers, periods, and underscores (max 50 characters)." };
  }
  if (data.tiktok_handle && !HANDLE_REGEX.test(data.tiktok_handle)) {
    return { error: "TikTok handle may only contain letters, numbers, periods, and underscores (max 50 characters)." };
  }
  return updateProfileFields({ ...data });
}

export async function updateAbout(data: AboutUpdate) {
  if (data.what_i_offer && data.what_i_offer.length > 3000) return { error: "What you offer must be 3,000 characters or fewer." };
  if (data.what_im_looking_for && data.what_im_looking_for.length > 3000) return { error: "What you're looking for must be 3,000 characters or fewer." };
  if (data.availability_status && data.availability_status.length > 200) return { error: "Availability status must be 200 characters or fewer." };
  return updateProfileFields({ ...data });
}

export async function updateRates(data: RatesUpdate) {
  return updateProfileFields({ ...data });
}

export async function updatePortfolio(data: PortfolioUpdate) {
  return updateProfileFields({ ...data });
}

export async function markProfileComplete() {
  return updateProfileFields({ profile_completed: true });
}

export async function updateDirectoryVisibility(show: boolean): Promise<{ error: string | null }> {
  return updateProfileFields({ show_in_directory: show });
}

export async function updateNewsletterOptIn(optIn: boolean): Promise<{ error: string | null }> {
  return updateProfileFields({ newsletter_opt_in: optIn } as Record<string, unknown>);
}
