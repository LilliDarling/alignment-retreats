// Shared CORS configuration for all edge functions
// Set ALLOWED_ORIGIN in Supabase secrets to restrict access to your production domain
// Supports comma-separated origins (e.g. "https://example.com,https://www.example.com")
// Automatically allows the www variant if not explicitly listed

const envOrigin = Deno.env.get("ALLOWED_ORIGIN");

if (!envOrigin) {
  console.warn(
    "CORS WARNING: ALLOWED_ORIGIN environment variable is not set. " +
    "Falling back to '*' (allow all origins). " +
    "Set ALLOWED_ORIGIN to your production domain (e.g. https://yourdomain.com) in Supabase secrets."
  );
}

// Build set of allowed origins (includes www variants automatically)
const allowedOrigins = new Set<string>();
if (envOrigin) {
  for (const origin of envOrigin.split(",").map(s => s.trim()).filter(Boolean)) {
    allowedOrigins.add(origin);
    // Auto-add www variant
    try {
      const url = new URL(origin);
      if (!url.hostname.startsWith("www.")) {
        allowedOrigins.add(`${url.protocol}//www.${url.hostname}`);
      } else {
        allowedOrigins.add(`${url.protocol}//${url.hostname.replace(/^www\./, "")}`);
      }
    } catch {
      // ignore invalid URLs
    }
  }
}

/**
 * Get CORS headers for a given request.
 * Matches the request's Origin against allowed origins.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get("origin") || "";
  const allowOrigin = allowedOrigins.size === 0
    ? "*"
    : allowedOrigins.has(requestOrigin)
      ? requestOrigin
      : [...allowedOrigins][0]; // fallback to first allowed origin

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

/**
 * Static CORS headers (legacy — uses first allowed origin or '*').
 * Prefer getCorsHeaders(req) for proper multi-origin support.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": envOrigin || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
