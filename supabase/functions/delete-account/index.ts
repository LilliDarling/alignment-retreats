import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  checkRateLimit,
  getClientIP,
  isValidUUID,
  securityHeaders,
  createAuditLog,
} from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...cors, ...securityHeaders } }
      );
    }

    // Rate limit — very strict for account deletion
    const ip = getClientIP(req);
    const rateLimit = checkRateLimit(`delete-account:${ip}`, {
      windowMs: 300000, // 5 minute window
      maxRequests: 3,
    });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...cors, ...securityHeaders } }
      );
    }

    // Verify authenticated user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...cors, ...securityHeaders } }
      );
    }

    const { userId } = await req.json();

    // Users can only delete their own account
    if (!userId || !isValidUUID(userId) || userId !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...cors, ...securityHeaders } }
      );
    }

    // Use service role to perform deletion
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create audit log before deletion
    const auditEntry = createAuditLog({
      action: "account_deletion",
      user_id: userId,
      resource_type: "user",
      resource_id: userId,
      details: { email: user.email },
      ip_address: ip,
    });
    console.log("AUDIT:", JSON.stringify(auditEntry));

    // Delete profile data (cascades via foreign keys for most tables)
    // Order: dependent tables first, then profile, then auth user

    // Remove user roles
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Remove profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // Delete the auth user last
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please contact support." }),
        { status: 500, headers: { ...cors, ...securityHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...cors, ...securityHeaders } }
    );
  } catch (error) {
    console.error("delete-account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, ...securityHeaders } }
    );
  }
});
