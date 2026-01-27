// Shared CORS configuration for all edge functions
// Set ALLOWED_ORIGIN in Supabase secrets to restrict access to your production domain

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");

if (!allowedOrigin) {
  console.warn(
    "CORS WARNING: ALLOWED_ORIGIN environment variable is not set. " +
    "Falling back to '*' (allow all origins). " +
    "Set ALLOWED_ORIGIN to your production domain (e.g. https://yourdomain.com) in Supabase secrets."
  );
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
