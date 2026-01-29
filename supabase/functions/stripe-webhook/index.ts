import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  checkRateLimit,
  getClientIP,
  securityHeaders
} from "../_shared/security.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Maximum events to process per minute (per IP)
const WEBHOOK_RATE_LIMIT = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID();

  // Rate limit webhooks by IP
  const rateLimitResult = checkRateLimit(`webhook:${clientIP}`, {
    windowMs: 60000,
    maxRequests: WEBHOOK_RATE_LIMIT,
  });

  if (!rateLimitResult.allowed) {
    console.error("Webhook rate limit exceeded:", { clientIP, requestId });
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    console.error("CRITICAL: STRIPE_SECRET_KEY is not configured", { requestId });
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Track event ID for error handling
  let currentEventId: string | null = null;

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    // ALWAYS require webhook secret - fail closed if not configured
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not configured", { requestId });
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // ALWAYS require signature header
    if (!signature) {
      console.error("Missing stripe-signature header - rejecting request", { requestId, clientIP });
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // ALWAYS verify the signature - no fallback path
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", { error: message, requestId, clientIP });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    // Store event ID for error handling
    currentEventId = event.id;

    // Idempotency check: skip already-completed events
    const { data: existingEvent } = await supabaseAdmin
      .from("processed_webhook_events")
      .select("event_id, status")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      // Only skip if previously completed successfully
      if (existingEvent.status === "completed") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // If status is 'processing' or 'failed', allow retry by continuing
    }

    // Record or update the event as 'processing' before business logic
    const { error: recordError } = await supabaseAdmin
      .from("processed_webhook_events")
      .upsert(
        { event_id: event.id, event_type: event.type, status: "processing" },
        { onConflict: "event_id" }
      );

    if (recordError) {
      console.error("Error recording webhook event:", recordError);
      // Continue processing - we don't want to lose the event
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { retreat_id, user_id, platform_fee } = session.metadata || {};

        if (!retreat_id || !user_id) {
          console.error("Missing metadata in checkout session");
          break;
        }

        // Create booking
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from("bookings")
          .insert({
            retreat_id,
            attendee_user_id: user_id,
          })
          .select()
          .single();

        if (bookingError) {
          console.error("Error creating booking:", bookingError);
          break;
        }

        // Create escrow account
        const totalAmount = (session.amount_total || 0) / 100;
        const { data: escrow, error: escrowError } = await supabaseAdmin
          .from("escrow_accounts")
          .insert({
            booking_id: booking.id,
            stripe_payment_intent_id: session.payment_intent as string,
            total_amount: totalAmount,
            held_amount: totalAmount,
            platform_fee: parseInt(platform_fee || "0") / 100,
            status: "holding",
          })
          .select()
          .single();

        if (escrowError) {
          console.error("Error creating escrow:", escrowError);
          break;
        }

        // Create booking payment record
        const { error: paymentError } = await supabaseAdmin
          .from("booking_payments")
          .insert({
            booking_id: booking.id,
            escrow_id: escrow.id,
            stripe_payment_id: session.payment_intent as string,
            stripe_customer_id: session.customer as string,
            amount_paid: totalAmount,
            payment_status: "completed",
          });

        if (paymentError) {
          console.error("Error creating payment record:", paymentError);
        }

        // Get retreat start_date for payout scheduling
        const { data: retreat } = await supabaseAdmin
          .from("retreats")
          .select("start_date")
          .eq("id", retreat_id)
          .single();

        if (retreat && retreat.start_date) {
          const startDate = new Date(retreat.start_date);
          const depositDate = new Date(); // Immediate
          const finalDate = new Date(startDate);
          finalDate.setDate(finalDate.getDate() - 7); // 1 week before retreat

          // Use get_payout_breakdown() to correctly calculate fees by type
          // (flat, per_person, per_night, per_person_per_night)
          const { data: payoutBreakdown, error: breakdownError } = await supabaseAdmin
            .rpc("get_payout_breakdown", { _booking_id: booking.id });

          if (breakdownError) {
            console.error("Error getting payout breakdown:", breakdownError);
          } else if (payoutBreakdown && payoutBreakdown.length > 0) {
            for (const member of payoutBreakdown) {
              if (member.deposit_amount <= 0 && member.final_amount <= 0) continue;

              // Create deposit payout (immediate)
              if (member.deposit_amount > 0) {
                await supabaseAdmin.from("scheduled_payouts").insert({
                  escrow_id: escrow.id,
                  recipient_user_id: member.recipient_user_id,
                  retreat_team_id: member.retreat_team_id,
                  amount: member.deposit_amount,
                  payout_type: "deposit",
                  scheduled_date: depositDate.toISOString().split("T")[0],
                  status: "scheduled",
                });
              }

              // Create final payout (1 week before retreat)
              if (member.final_amount > 0) {
                await supabaseAdmin.from("scheduled_payouts").insert({
                  escrow_id: escrow.id,
                  recipient_user_id: member.recipient_user_id,
                  retreat_team_id: member.retreat_team_id,
                  amount: member.final_amount,
                  payout_type: "final",
                  scheduled_date: finalDate.toISOString().split("T")[0],
                  status: "scheduled",
                });
              }
            }
          }
        }

        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        
        // Update connected account status
        await supabaseAdmin
          .from("stripe_connected_accounts")
          .update({
            onboarding_complete: account.details_submitted,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            account_status: account.details_submitted ? "active" : "onboarding",
          })
          .eq("stripe_account_id", account.id);

        break;
      }

      case "transfer.created":
      case "transfer.updated": {
        const transfer = event.data.object as Stripe.Transfer;
        
        // Update payout status
        if (transfer.metadata?.payout_id) {
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              stripe_transfer_id: transfer.id,
              status: transfer.reversed ? "failed" : "completed",
              processed_at: new Date().toISOString(),
            })
            .eq("id", transfer.metadata.payout_id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        // Payment failure handled - no action needed
        break;
      }
    }

    // Mark event as successfully processed
    await supabaseAdmin
      .from("processed_webhook_events")
      .update({ status: "completed" })
      .eq("event_id", event.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Mark event as failed so it can be retried
    if (currentEventId) {
      try {
        await supabaseAdmin
          .from("processed_webhook_events")
          .update({ status: "failed" })
          .eq("event_id", currentEventId);
      } catch {
        // Ignore errors updating status
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
