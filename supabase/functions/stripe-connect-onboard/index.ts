import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  checkRateLimit,
  isValidReturnUrl,
  getClientIP,
  securityHeaders
} from "../_shared/security.ts";
import { corsHeaders } from "../_shared/cors.ts";

const VALID_ACTIONS = ["create_account", "check_status", "create_login_link"] as const;
type ValidAction = typeof VALID_ACTIONS[number];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID();

  // Log request for audit
  console.log("Stripe Connect request received:", {
    requestId,
    timestamp: new Date().toISOString(),
    clientIP,
    method: req.method,
  });

  try {
    // Rate limit by IP: 10 requests per minute
    const rateLimitResult = checkRateLimit(`stripe-connect:${clientIP}`, {
      windowMs: 60000,
      maxRequests: 10,
    });

    if (!rateLimitResult.allowed) {
      console.warn("Rate limit exceeded:", { clientIP, requestId });
      return new Response(JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        retry_after: Math.ceil(rateLimitResult.resetIn / 1000)
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...securityHeaders,
          "Retry-After": Math.ceil(rateLimitResult.resetIn / 1000).toString()
        },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Missing or invalid auth header:", { requestId });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.warn("Invalid token:", { requestId, error: userError?.message });
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // User-specific rate limit: 20 per hour
    const userRateLimitResult = checkRateLimit(`stripe-connect:user:${user.id}`, {
      windowMs: 3600000,
      maxRequests: 20,
    });

    if (!userRateLimitResult.allowed) {
      console.warn("User rate limit exceeded:", { userId: user.id, requestId });
      return new Response(JSON.stringify({ 
        error: "Request limit reached. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse and validate request body
    let body: { action?: string; return_url?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const { action, return_url } = body;

    // Validate action
    if (!action || !VALID_ACTIONS.includes(action as ValidAction)) {
      console.warn("Invalid action:", { action, requestId });
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Validate return URL if provided
    const origin = req.headers.get("origin") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const allowedOrigins = [origin, supabaseUrl].filter(Boolean);
    
    if (return_url && !isValidReturnUrl(return_url, allowedOrigins)) {
      console.warn("Invalid return_url:", { return_url, requestId });
      return new Response(JSON.stringify({ error: "Invalid return URL" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (action === "create_account") {
      // Check if user already has a connected account
      const { data: existingAccount } = await supabaseClient
        .from("stripe_connected_accounts")
        .select("stripe_account_id, account_status")
        .eq("user_id", user.id)
        .single();

      let stripeAccountId: string;

      if (existingAccount) {
        stripeAccountId = existingAccount.stripe_account_id;
        console.log("Using existing Stripe account:", { 
          userId: user.id, 
          accountId: stripeAccountId.substring(0, 10) + "...",
          requestId 
        });
      } else {
        // Create new Stripe Connect account
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email,
          metadata: {
            user_id: user.id,
            created_via: "lovable_connect_onboard",
          },
        });

        stripeAccountId = account.id;

        // Save to database
        const { error: insertError } = await supabaseClient
          .from("stripe_connected_accounts")
          .insert({
            user_id: user.id,
            stripe_account_id: stripeAccountId,
            account_status: "onboarding",
          });

        if (insertError) {
          console.error("Error saving Stripe account:", { error: insertError, requestId });
          // Continue - the account was created in Stripe, we can try to save again later
        }

        console.log("Created new Stripe account:", { 
          userId: user.id, 
          accountId: stripeAccountId.substring(0, 10) + "...",
          requestId 
        });
      }

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: return_url || `${origin}/dashboard`,
        return_url: return_url || `${origin}/dashboard`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (action === "check_status") {
      const { data: accountData } = await supabaseClient
        .from("stripe_connected_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

      if (!accountData) {
        return new Response(JSON.stringify({ status: "not_connected" }), {
          status: 200,
          headers: { ...corsHeaders, ...securityHeaders },
        });
      }

      const account = await stripe.accounts.retrieve(accountData.stripe_account_id);

      // Update database with current status
      const { error: updateError } = await supabaseClient
        .from("stripe_connected_accounts")
        .update({
          onboarding_complete: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          account_status: account.details_submitted ? "active" : "onboarding",
          business_type: account.business_type,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating account status:", { error: updateError, requestId });
      }

      return new Response(JSON.stringify({
        status: account.details_submitted ? "active" : "onboarding",
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (action === "create_login_link") {
      const { data: accountData } = await supabaseClient
        .from("stripe_connected_accounts")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();

      if (!accountData) {
        return new Response(JSON.stringify({ error: "No connected account" }), {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders },
        });
      }

      const loginLink = await stripe.accounts.createLoginLink(accountData.stripe_account_id);

      console.log("Created Stripe dashboard login link:", { 
        userId: user.id, 
        requestId 
      });

      return new Response(JSON.stringify({ url: loginLink.url }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  } catch (error: unknown) {
    console.error("Stripe Connect error:", { 
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
      clientIP 
    });
    
    // Don't expose internal error details
    return new Response(JSON.stringify({ error: "Request failed" }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }
});
