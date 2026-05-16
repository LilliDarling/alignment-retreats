"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteStorageUrl } from "@/lib/utils/storage";
import type { AppRole } from "@/types/auth";
import type {
  EditableProfile,
  BasicInfoUpdate,
  ProfessionalUpdate,
  SocialLinksUpdate,
  AboutUpdate,
  PortfolioUpdate,
} from "@/types/profile";

const PROFILE_SELECT = `
  id, name, slug, bio, profile_photo, cover_photo, location,
  expertise_areas, certifications, languages, years_experience,
  availability_status, what_i_offer, what_im_looking_for,
  instagram_handle, tiktok_handle, website_url,
  portfolio_photos, portfolio_videos,
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
    travel_willing: (data.travel_willing as boolean) || false,
    show_in_directory: (data.show_in_directory as boolean) || false,
    profile_completed: (data.profile_completed as boolean) || false,
  };
}

const COMPLETION_FIELDS = `
  name, bio, location, profile_photo,
  expertise_areas, languages, years_experience,
  what_i_offer, what_im_looking_for, availability_status,
  instagram_handle, tiktok_handle, profile_completed
` as const;

function isProfileComplete(p: Record<string, unknown>): boolean {
  const hasStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const hasArr = (v: unknown) => Array.isArray(v) && v.length > 0;
  return (
    hasStr(p.name) &&
    hasStr(p.bio) &&
    hasStr(p.location) &&
    hasStr(p.profile_photo) &&
    hasArr(p.expertise_areas) &&
    hasArr(p.languages) &&
    p.years_experience != null &&
    hasStr(p.what_i_offer) &&
    hasStr(p.what_im_looking_for) &&
    hasStr(p.availability_status) &&
    (hasStr(p.instagram_handle) || hasStr(p.tiktok_handle))
  );
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

  if (!fields.profile_completed) {
    const { data: current } = await supabase
      .from("profiles")
      .select(COMPLETION_FIELDS)
      .eq("id", userId)
      .single() as { data: Record<string, unknown> | null };

    if (current && !current.profile_completed && isProfileComplete(current)) {
      await supabase
        .from("profiles")
        .update({ profile_completed: true })
        .eq("id", userId);
    }
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateBasicInfo(data: BasicInfoUpdate) {
  if (!data.name?.trim()) return { error: "Name is required." };
  if (data.name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (!data.bio?.trim()) return { error: "Bio is required." };
  if (data.bio.length > 8000) return { error: "Bio must be 8,000 characters or fewer." };
  if (!data.location?.trim()) return { error: "Location is required." };
  if (data.location.length > 200) return { error: "Location must be 200 characters or fewer." };
  if (!data.profile_photo) return { error: "Profile photo is required." };

  // Clean up old photos from storage if being replaced or removed
  const userId = await getAuthUserId();
  if (userId && (data.profile_photo !== undefined || data.cover_photo !== undefined)) {
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("profiles")
      .select("profile_photo, cover_photo")
      .eq("id", userId)
      .single();

    if (current) {
      const old = current as Record<string, unknown>;
      if (old.profile_photo && old.profile_photo !== data.profile_photo) {
        deleteStorageUrl(old.profile_photo as string).catch(() => {});
      }
      if (old.cover_photo && old.cover_photo !== data.cover_photo) {
        deleteStorageUrl(old.cover_photo as string).catch(() => {});
      }
    }
  }

  return updateProfileFields({ ...data });
}

export async function updateProfessional(data: ProfessionalUpdate) {
  if (!data.expertise_areas?.length) return { error: "At least one expertise area is required." };
  if (!data.languages?.length) return { error: "At least one language is required." };
  if (data.years_experience == null) return { error: "Years of experience is required." };
  return updateProfileFields({ ...data });
}

const HANDLE_REGEX = /^[a-zA-Z0-9._]{1,50}$/;

export async function updateSocialLinks(data: SocialLinksUpdate) {
  const instagram = data.instagram_handle?.trim() || "";
  const tiktok = data.tiktok_handle?.trim() || "";
  if (!instagram && !tiktok) {
    return { error: "Please add at least one social handle (Instagram or TikTok)." };
  }
  if (instagram && !HANDLE_REGEX.test(instagram)) {
    return { error: "Instagram handle may only contain letters, numbers, periods, and underscores (max 50 characters)." };
  }
  if (tiktok && !HANDLE_REGEX.test(tiktok)) {
    return { error: "TikTok handle may only contain letters, numbers, periods, and underscores (max 50 characters)." };
  }
  return updateProfileFields({
    ...data,
    instagram_handle: instagram || null,
    tiktok_handle: tiktok || null,
    website_url: data.website_url?.trim() || null,
  });
}

export async function updateAbout(data: AboutUpdate) {
  if (!data.what_i_offer?.trim()) return { error: "What you offer is required." };
  if (data.what_i_offer.length > 3000) return { error: "What you offer must be 3,000 characters or fewer." };
  if (!data.what_im_looking_for?.trim()) return { error: "What you're looking for is required." };
  if (data.what_im_looking_for.length > 3000) return { error: "What you're looking for must be 3,000 characters or fewer." };
  if (!data.availability_status?.trim()) return { error: "Availability status is required." };
  if (data.availability_status.length > 200) return { error: "Availability status must be 200 characters or fewer." };
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

const SELF_ASSIGNABLE_ROLES: AppRole[] = ["host", "cohost", "landowner", "staff", "attendee"];

export async function addUserRole(role: AppRole): Promise<{ error: string | null }> {
  if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
    return { error: "That role can't be self-assigned." };
  }

  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role", ignoreDuplicates: true }
    );
  if (roleErr) return { error: roleErr.message };

  const profileTable =
    role === "host" ? "hosts" :
    role === "cohost" ? "cohosts" :
    role === "staff" ? "staff_profiles" :
    null;

  if (profileTable) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileErr } = await (supabase as any)
      .from(profileTable)
      .upsert(
        { user_id: userId },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
    if (profileErr) return { error: profileErr.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/settings");
  revalidatePath("/dashboard");
  return { error: null };
}
