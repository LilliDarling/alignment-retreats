import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { 
  checkRateLimit, 
  isValidUUID,
  getClientIP,
  securityHeaders 
} from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum payouts per execution to prevent runaway processing
const MAX_PAYOUTS_PER_RUN = 100;
// Maximum amount per single payout (safety limit)
const MAX_PAYOUT_AMOUNT = 50000; // $50,000

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const requestId = crypto.randomUUID();

  // Log request for audit purposes
  console.log("Scheduled payout request received:", {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    clientIP,
  });

  // Rate limit: Only allow 5 calls per minute to prevent abuse
  const rateLimitResult = checkRateLimit("payout-processor", {
    windowMs: 60000,
    maxRequests: 5,
  });

  if (!rateLimitResult.allowed) {
    console.error("Payout processor rate limit exceeded:", { requestId, clientIP });
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }

  // Verify cron secret - fail closed if not configured
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("CRITICAL: CRON_SECRET is not configured", { requestId });
    return new Response(JSON.stringify({ error: "Function not configured" }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }

  // Constant-time comparison to prevent timing attacks
  const providedSecret = req.headers.get("x-cron-secret") || "";
  
  // Timing-safe comparison
  function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  
  const secretsMatch = timingSafeEqual(providedSecret, cronSecret);

  if (!secretsMatch) {
    console.error("Unauthorized payout processing attempt - invalid or missing cron secret", {
      requestId,
      clientIP,
      hasSecret: !!providedSecret,
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    console.error("CRITICAL: STRIPE_SECRET_KEY is not configured", { requestId });
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
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

  try {
    const today = new Date().toISOString().split("T")[0];

    // Get pending payouts scheduled for today or earlier (limited for safety)
    const { data: pendingPayouts, error: fetchError } = await supabaseAdmin
      .from("scheduled_payouts")
      .select(`
        *,
        escrow:escrow_accounts(
          id,
          booking_id,
          held_amount,
          released_amount,
          status
        )
      `)
      .eq("status", "scheduled")
      .lte("scheduled_date", today)
      .limit(MAX_PAYOUTS_PER_RUN)
      .order("scheduled_date", { ascending: true });

    if (fetchError) {
      console.error("Error fetching payouts:", { error: fetchError, requestId });
      return new Response(JSON.stringify({ error: "Failed to fetch payouts" }), {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    if (!pendingPayouts || pendingPayouts.length === 0) {
      console.log("No payouts to process", { requestId });
      return new Response(JSON.stringify({ processed: 0, requestId }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders },
      });
    }

    console.log(`Processing ${pendingPayouts.length} payouts`, { requestId });

    let processed = 0;
    let failed = 0;

    for (const payout of pendingPayouts) {
      try {
        // Validate payout data
        if (!isValidUUID(payout.id) || !isValidUUID(payout.recipient_user_id)) {
          console.error("Invalid payout data - malformed UUIDs:", { 
            payoutId: payout.id, 
            requestId 
          });
          failed++;
          continue;
        }

        // Validate amount
        if (typeof payout.amount !== 'number' || payout.amount <= 0) {
          console.error("Invalid payout amount:", { 
            payoutId: payout.id, 
            amount: payout.amount,
            requestId 
          });
          
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: "Invalid payout amount",
            })
            .eq("id", payout.id);
          
          failed++;
          continue;
        }

        // Safety limit check
        if (payout.amount > MAX_PAYOUT_AMOUNT) {
          console.error("Payout exceeds safety limit:", { 
            payoutId: payout.id, 
            amount: payout.amount,
            limit: MAX_PAYOUT_AMOUNT,
            requestId 
          });
          
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: `Payout amount $${payout.amount} exceeds safety limit of $${MAX_PAYOUT_AMOUNT}`,
            })
            .eq("id", payout.id);
          
          failed++;
          continue;
        }

        // Verify escrow has sufficient funds
        const escrow = payout.escrow;
        if (!escrow || (escrow.held_amount || 0) < payout.amount) {
          console.error("Insufficient escrow funds:", { 
            payoutId: payout.id, 
            payoutAmount: payout.amount,
            heldAmount: escrow?.held_amount,
            requestId 
          });
          
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: "Insufficient escrow funds",
            })
            .eq("id", payout.id);
          
          failed++;
          continue;
        }

        // Get recipient's Stripe account
        const { data: stripeAccount } = await supabaseAdmin
          .from("stripe_connected_accounts")
          .select("stripe_account_id, payouts_enabled, user_id")
          .eq("user_id", payout.recipient_user_id)
          .single();

        // Verify the Stripe account belongs to the correct recipient
        if (!stripeAccount || stripeAccount.user_id !== payout.recipient_user_id) {
          console.error("Stripe account mismatch or not found:", { 
            payoutId: payout.id, 
            recipientUserId: payout.recipient_user_id,
            requestId 
          });
          
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: "Stripe account verification failed",
            })
            .eq("id", payout.id);
          
          failed++;
          continue;
        }

        if (!stripeAccount.payouts_enabled) {
          console.error("Payouts not enabled for Stripe account:", { 
            payoutId: payout.id, 
            recipientUserId: payout.recipient_user_id,
            requestId 
          });
          
          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: "Stripe payouts not enabled for recipient",
            })
            .eq("id", payout.id);
          
          failed++;
          continue;
        }

        // Create transfer to connected account with idempotency key
        const idempotencyKey = `payout_${payout.id}_${requestId}`;
        const amountInCents = Math.round(payout.amount * 100);
        
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: "usd",
          destination: stripeAccount.stripe_account_id,
          metadata: {
            payout_id: payout.id,
            escrow_id: payout.escrow_id,
            payout_type: payout.payout_type,
            request_id: requestId,
          },
        }, {
          idempotencyKey,
        });

        // Update payout status
        await supabaseAdmin
          .from("scheduled_payouts")
          .update({
            stripe_transfer_id: transfer.id,
            status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", payout.id);

        // Update escrow account
        const newReleasedAmount = (escrow.released_amount || 0) + payout.amount;
        const newHeldAmount = (escrow.held_amount || 0) - payout.amount;
        
        const newStatus = newHeldAmount <= 0 ? "fully_released" : "partial_released";

        await supabaseAdmin
          .from("escrow_accounts")
          .update({
            released_amount: newReleasedAmount,
            held_amount: Math.max(0, newHeldAmount),
            status: newStatus,
            ...(payout.payout_type === "deposit" 
              ? { deposit_released_at: new Date().toISOString() }
              : { final_released_at: new Date().toISOString() }
            ),
          })
          .eq("id", payout.escrow_id);

        console.log("Payout processed successfully:", { 
          payoutId: payout.id, 
          amount: payout.amount,
          transferId: transfer.id,
          recipientAccount: stripeAccount.stripe_account_id.substring(0, 10) + "...",
          requestId 
        });
        processed++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error processing payout:", { 
          payoutId: payout.id,
          error: message,
          requestId 
        });
        
        await supabaseAdmin
          .from("scheduled_payouts")
          .update({
            status: "failed",
            failure_reason: message.substring(0, 500), // Limit error message length
          })
          .eq("id", payout.id);
        
        failed++;
      }
    }

    console.log("Payout processing complete:", { 
      processed, 
      failed, 
      total: pendingPayouts.length,
      requestId 
    });

    return new Response(JSON.stringify({ 
      processed, 
      failed, 
      requestId,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Payout processing error:", { error: message, requestId });
    
    // Don't expose internal error details
    return new Response(JSON.stringify({ 
      error: "Payout processing failed",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders },
    });
  }
});
