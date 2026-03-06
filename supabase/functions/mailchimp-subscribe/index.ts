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

/** MD5 hex hash — tries crypto.subtle first, falls back to SHA-256 truncated */
async function md5Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  try {
    const buf = await crypto.subtle.digest("MD5", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback: SHA-256 truncated to 32 hex chars (same length as MD5)
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  }
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

  // Mailchimp uses MD5 hash of lowercase email as subscriber ID
  const subscriberHash = await md5Hex(email.toLowerCase());

  const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`;

  const nameParts = (name || "").trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const body: Record<string, unknown> = {
    email_address: email,
    status_if_new: subscribe ? "subscribed" : "unsubscribed",
    status: subscribe ? "subscribed" : "unsubscribed",
  };

  if (subscribe && (firstName || lastName)) {
    body.merge_fields = { FNAME: firstName, LNAME: lastName };
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailchimp error:", response.status, errorText);
    return { ok: false, error: `Mailchimp API error: ${response.status}` };
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
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
