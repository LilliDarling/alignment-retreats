import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export type MediaType = "image" | "video";

export function getMediaType(file: File): MediaType | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is 50MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  }
  if (!getMediaType(file)) {
    return `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.`;
  }
  return null;
}

function generateFileName(file: File): string {
  const ext = file.name.split(".").pop() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };
  if (getMediaType(file) !== "image") return { error: "Profile photo must be an image." };

  const supabase = createClient();
  const path = `${userId}/${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadPortfolioMedia(
  userId: string,
  file: File
): Promise<{ url: string; type: MediaType } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };

  const mediaType = getMediaType(file);
  if (!mediaType) return { error: "Unsupported file type." };

  const supabase = createClient();
  const path = `${userId}/${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("portfolio-media")
    .upload(path, file);

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("portfolio-media")
    .getPublicUrl(path);

  return { url: publicUrl, type: mediaType };
}

export async function uploadRetreatImage(
  retreatId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };
  if (getMediaType(file) !== "image") return { error: "Retreat image must be an image." };

  const supabase = createClient();

  // Storage policy requires the first folder to be the user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/${retreatId}-${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("retreat-photos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("retreat-photos")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadRetreatVideo(
  retreatId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };
  if (getMediaType(file) !== "video") return { error: "File must be a video." };

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/${retreatId}-${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("retreat-photos")
    .upload(path, file);

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("retreat-photos")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadVenueImage(
  propertyId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };
  if (getMediaType(file) !== "image") return { error: "Venue photo must be an image." };

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/${propertyId}-${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("venue-photos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("venue-photos")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadVenueVideo(
  propertyId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };
  if (getMediaType(file) !== "video") return { error: "File must be a video." };

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/${propertyId}-${generateFileName(file)}`;

  const { error } = await supabase.storage
    .from("venue-photos")
    .upload(path, file);

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from("venue-photos")
    .getPublicUrl(path);

  return { url: publicUrl };
}

export async function deleteStorageFile(
  bucket: string,
  url: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Extract path from public URL
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
  if (!pathMatch) return { error: "Could not parse file path from URL." };

  const { error } = await supabase.storage.from(bucket).remove([pathMatch[1]]);
  return { error: error?.message ?? null };
}
