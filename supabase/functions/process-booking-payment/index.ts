import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  checkRateLimit,
  isValidUUID,
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

  // Log request for audit
  console.log("Payment request received:", {
    requestId,
    timestamp: new Date().toISOString(),
    clientIP,
    method: req.method,
  });

  try {
    // Rate limit by IP: 5 payment attempts per minute
    const rateLimitResult = checkRateLimit(`payment:${clientIP}`, {
      windowMs: 60000,
      maxRequests: 5,
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

    // Additional rate limit by user: 10 per hour
    const userRateLimitResult = checkRateLimit(`payment:user:${user.id}`, {
      windowMs: 3600000,
      maxRequests: 10,
    });

    if (!userRateLimitResult.allowed) {
      console.warn("User rate limit exceeded:", { userId: user.id, requestId });
      return new Response(JSON.stringify({ 
        error: "Payment limit reached. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse and validate request body
    let body: { retreat_id?: string; success_url?: string; cancel_url?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    const { retreat_id, success_url, cancel_url } = body;

    // Validate retreat_id format
    if (!retreat_id || !isValidUUID(retreat_id)) {
      console.warn("Invalid retreat_id format:", { retreat_id, requestId });
      return new Response(JSON.stringify({ error: "Invalid retreat ID" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Validate return URLs to prevent open redirect
    const origin = req.headers.get("origin") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const allowedOrigins = [origin, supabaseUrl].filter(Boolean);
    
    if (success_url && !isValidReturnUrl(success_url, allowedOrigins)) {
      console.warn("Invalid success_url:", { success_url, requestId });
      return new Response(JSON.stringify({ error: "Invalid success URL" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (cancel_url && !isValidReturnUrl(cancel_url, allowedOrigins)) {
      console.warn("Invalid cancel_url:", { cancel_url, requestId });
      return new Response(JSON.stringify({ error: "Invalid cancel URL" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Fetch retreat details - use service role for reliable access
    const { data: retreat, error: retreatError } = await supabaseClient
      .from("retreats")
      .select("id, title, retreat_type, price_per_person, status, max_attendees, start_date, retreat_team(*)")
      .eq("id", retreat_id)
      .eq("status", "published") // Only allow booking published retreats
      .single();

    if (retreatError || !retreat) {
      console.warn("Retreat not found or not published:", { retreat_id, requestId });
      return new Response(JSON.stringify({ error: "Retreat not found or not available" }), {
        status: 404,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Block bookings for retreats that have already started
    if (retreat.start_date) {
      const startDate = new Date(retreat.start_date + "T00:00:00Z");
      if (new Date() >= startDate) {
        console.warn("Booking attempt for past/started retreat:", { retreat_id, start_date: retreat.start_date, requestId });
        return new Response(JSON.stringify({ error: "This retreat has already started and is no longer accepting bookings" }), {
          status: 410,
          headers: { ...corsHeaders, ...securityHeaders },
        });
      }
    }

    // Check if user already has a booking for this retreat
    const { data: existingBooking } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("retreat_id", retreat_id)
      .eq("attendee_user_id", user.id)
      .single();

    if (existingBooking) {
      console.warn("Duplicate booking attempt:", { userId: user.id, retreat_id, requestId });
      return new Response(JSON.stringify({ error: "You already have a booking for this retreat" }), {
        status: 409,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Check max attendees capacity using service role for accurate count
    if (retreat.max_attendees) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { count, error: countError } = await supabaseAdmin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("retreat_id", retreat_id);

      if (countError) {
        console.error("Error checking booking count:", { retreat_id, requestId, error: countError.message });
        return new Response(JSON.stringify({ error: "Unable to verify availability" }), {
          status: 500,
          headers: { ...corsHeaders, ...securityHeaders },
        });
      }

      if ((count ?? 0) >= retreat.max_attendees) {
        console.warn("Retreat at capacity:", { retreat_id, count, max: retreat.max_attendees, requestId });
        return new Response(JSON.stringify({ error: "This retreat is fully booked" }), {
          status: 409,
          headers: { ...corsHeaders, ...securityHeaders },
        });
      }
    }

    const pricePerPerson = retreat.price_per_person || 0;
    const totalAmount = Math.round(pricePerPerson * 100); // Convert to cents

    if (totalAmount <= 0 || totalAmount > 100000000) { // Max $1M
      console.error("Invalid price:", { pricePerPerson, retreat_id, requestId });
      return new Response(JSON.stringify({ error: "Invalid price configuration" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Calculate platform fee (30%)
    const platformFee = Math.round(totalAmount * 0.30);

    // Create or get Stripe customer
    const { data: existingCustomers } = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Create Checkout Session with idempotency
    const idempotencyKey = `checkout_${user.id}_${retreat_id}_${Date.now()}`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: retreat.title,
              description: `Retreat booking - ${retreat.retreat_type || "Retreat"}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url || `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${origin}/retreats/${retreat_id}`,
      metadata: {
        retreat_id,
        user_id: user.id,
        platform_fee: platformFee.toString(),
        request_id: requestId,
      },
      payment_intent_data: {
        metadata: {
          retreat_id,
          user_id: user.id,
          request_id: requestId,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min expiry
    }, {
      idempotencyKey,
    });

    console.log("Checkout session created:", { 
      sessionId: session.id, 
      userId: user.id, 
      retreat_id,
      amount: totalAmount,
      requestId 
    });

    return new Response(JSON.stringify({
      session_id: session.id,
      url: session.url,
    }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  } catch (error: unknown) {
    console.error("Payment processing error:", { 
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
      clientIP 
    });
    
    // Don't expose internal error details
    return new Response(JSON.stringify({ error: "Payment processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }
});
