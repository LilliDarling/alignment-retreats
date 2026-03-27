// @ts-nocheck — Deno edge function; IDE may flag URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, securityHeaders } from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
const MAILERLITE_GROUP_ID = Deno.env.get("MAILERLITE_GROUP_ID"); // optional — assign to a group on subscribe

interface SubscribeRequest {
  email: string;
  subscribe: boolean;
  name?: string;
}

async function mailerliteRequest(
  email: string,
  subscribe: boolean,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!MAILERLITE_API_KEY) {
    console.warn("MailerLite not configured — skipping API call");
    return { ok: true };
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MAILERLITE_API_KEY}`,
  };

  if (subscribe) {
    // Upsert subscriber via POST /subscribers
    const body: Record<string, unknown> = {
      email,
      status: "active",
    };

    if (name) {
      const parts = name.trim().split(" ");
      body.fields = {
        name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
      };
    }

    if (MAILERLITE_GROUP_ID) {
      body.groups = [MAILERLITE_GROUP_ID];
    }

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("MailerLite subscribe error:", res.status, text);
      return { ok: false, error: `MailerLite API error: ${res.status}` };
    }

    return { ok: true };
  } else {
    // Unsubscribe: find subscriber then update status
    const findRes = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`,
      { headers }
    );

    if (!findRes.ok) {
      if (findRes.status === 404) return { ok: true };
      const text = await findRes.text();
      console.error("MailerLite find error:", findRes.status, text);
      return { ok: false, error: `MailerLite API error: ${findRes.status}` };
    }

    const subscriber = await findRes.json();
    const subscriberId = subscriber.data?.id;
    if (!subscriberId) return { ok: true };

    const updateRes = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "unsubscribed" }),
      }
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error("MailerLite unsubscribe error:", updateRes.status, text);
      return { ok: false, error: `MailerLite API error: ${updateRes.status}` };
    }

    return { ok: true };
  }
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...cors, ...securityHeaders } }
      );
    }

    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(`mailerlite:${ip}`, {
      windowMs: 60000,
      maxRequests: 5,
    });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...cors, ...securityHeaders } }
      );
    }

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

    if (email !== user.email) {
      return new Response(
        JSON.stringify({ error: "Cannot manage subscription for another user" }),
        { status: 403, headers: { ...cors, ...securityHeaders } }
      );
    }

    const result = await mailerliteRequest(email, subscribe, name);

    return new Response(
      JSON.stringify({ success: result.ok, error: result.error }),
      { status: result.ok ? 200 : 500, headers: { ...cors, ...securityHeaders } }
    );
  } catch (error) {
    console.error("mailerlite-subscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, ...securityHeaders } }
    );
  }
});
