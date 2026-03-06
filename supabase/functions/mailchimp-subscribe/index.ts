// @ts-nocheck — Deno edge function; IDE may flag URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, securityHeaders } from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_LIST_ID = Deno.env.get("MAILCHIMP_LIST_ID");
const MAILCHIMP_SERVER_PREFIX = Deno.env.get("MAILCHIMP_SERVER_PREFIX"); // e.g. "us21"

interface SubscribeRequest {
  email: string;
  subscribe: boolean;
  name?: string;
}

async function mailchimpRequest(
  email: string,
  subscribe: boolean,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
    console.warn("Mailchimp not configured — skipping API call");
    return { ok: true };
  }

  const authHeader = `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`;
  const baseUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

  const nameParts = (name || "").trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Search for the member using Mailchimp's search endpoint
  const searchUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/search-members?query=${encodeURIComponent(email)}&list_id=${MAILCHIMP_LIST_ID}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: authHeader },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    // Find exact email match from search results
    const match = searchData.exact_matches?.members?.find(
      (m: { email_address: string }) => m.email_address.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      // Member exists — update their status via PATCH using their ID
      const patchRes = await fetch(`${baseUrl}/${match.id}?skip_merge_validation=true`, {
        method: "PATCH",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          status: subscribe ? "subscribed" : "unsubscribed",
        }),
      });

      if (!patchRes.ok) {
        const errorText = await patchRes.text();
        console.error("Mailchimp PATCH error:", patchRes.status, errorText);
        return { ok: false, error: `Mailchimp API error: ${patchRes.status}` };
      }

      return { ok: true };
    }
  }

  // Member doesn't exist yet — create them via POST
  const body: Record<string, unknown> = {
    email_address: email,
    status: subscribe ? "subscribed" : "unsubscribed",
  };

  if (firstName || lastName) {
    body.merge_fields = { FNAME: firstName, LNAME: lastName };
  }

  const createRes = await fetch(baseUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Mailchimp POST error:", createRes.status, errorText);
    return { ok: false, error: `Mailchimp API error: ${createRes.status}` };
  }

  return { ok: true };
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...cors, ...securityHeaders } }
      );
    }

    // Rate limit by IP
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(`mailchimp:${ip}`, {
      windowMs: 60000,
      maxRequests: 5,
    });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...cors, ...securityHeaders } }
      );
    }

    // Verify the user is authenticated via Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...cors, ...securityHeaders } }
      );
    }

    const { email, subscribe, name } = (await req.json()) as SubscribeRequest;

    // Only allow users to manage their own email subscription
    if (email !== user.email) {
      return new Response(
        JSON.stringify({ error: "Cannot manage subscription for another user" }),
        { status: 403, headers: { ...cors, ...securityHeaders } }
      );
    }

    const result = await mailchimpRequest(email, subscribe, name);

    return new Response(
      JSON.stringify({ success: result.ok, error: result.error }),
      { status: result.ok ? 200 : 500, headers: { ...cors, ...securityHeaders } }
    );
  } catch (error) {
    console.error("mailchimp-subscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, ...securityHeaders } }
    );
  }
});
