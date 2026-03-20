import { createClient } from "@/lib/supabase/server";

/**
 * Extract bucket name and file path from a Supabase storage public URL.
 * URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(
      /\/storage\/v1\/object\/public\/([^/]+)\/(.+)/
    );
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch {
    return null;
  }
}

/**
 * Delete a single file from Supabase storage given its public URL.
 * Silently skips invalid URLs.
 */
export async function deleteStorageUrl(url: string): Promise<void> {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;

  const supabase = await createClient();
  await supabase.storage.from(parsed.bucket).remove([parsed.path]);
}

/**
 * Delete multiple files from Supabase storage given their public URLs.
 * Groups by bucket for efficiency.
 */
export async function deleteStorageUrls(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    const paths = byBucket.get(parsed.bucket) || [];
    paths.push(parsed.path);
    byBucket.set(parsed.bucket, paths);
  }

  const supabase = await createClient();
  await Promise.all(
    [...byBucket.entries()].map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(paths)
    )
  );
}

/**
 * Given old and new URL arrays, delete any URLs that were removed.
 */
export async function cleanupRemovedUrls(
  oldUrls: string[],
  newUrls: string[]
): Promise<void> {
  const kept = new Set(newUrls);
  const removed = oldUrls.filter((url) => !kept.has(url));
  await deleteStorageUrls(removed);
}
