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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID();

  try {
    // Rate limit by IP: 5 donation attempts per minute
    const rateLimitResult = checkRateLimit(`donation:${clientIP}`, {
      windowMs: 60000,
      maxRequests: 5,
    });

    if (!rateLimitResult.allowed) {
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

    // Require authentication for donations
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Parse request body
    let body: { amount?: number; success_url?: string; cancel_url?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const { amount, success_url, cancel_url } = body;

    // Validate amount
    if (!amount || typeof amount !== "number" || amount < 1 || amount > 10000) {
      return new Response(JSON.stringify({ error: "Invalid donation amount. Must be between $1 and $10,000." }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Validate return URLs
    const origin = req.headers.get("origin") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const allowedOrigins = [origin, supabaseUrl].filter(Boolean);

    if (success_url && !isValidReturnUrl(success_url, allowedOrigins)) {
      return new Response(JSON.stringify({ error: "Invalid success URL" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (cancel_url && !isValidReturnUrl(cancel_url, allowedOrigins)) {
      return new Response(JSON.stringify({ error: "Invalid cancel URL" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const amountCents = Math.round(amount * 100);
    const idempotencyKey = `donation_${user.id}_${Date.now()}`;

    // Find or create Stripe customer
    let customerId: string | undefined;
    if (user.email) {
      const { data: existingCustomers } = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
      }
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Donation to Alignment Retreats",
              description: "Thank you for supporting our community!",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url || `${origin}/donate?success=true`,
      cancel_url: cancel_url || `${origin}/donate`,
      metadata: {
        type: "donation",
        user_id: user.id,
        amount: amountCents.toString(),
        request_id: requestId,
      },
      payment_intent_data: {
        metadata: {
          type: "donation",
          user_id: user.id,
          request_id: requestId,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min expiry
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey,
    });

    return new Response(JSON.stringify({
      session_id: session.id,
      url: session.url,
    }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  } catch (error: unknown) {
    console.error("Donation processing error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
      clientIP
    });

    return new Response(JSON.stringify({ error: "Donation processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }
});
