import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Maximum payouts per execution
const MAX_PAYOUTS_PER_RUN = 100;
// Maximum amount per single payout (safety limit)
const MAX_PAYOUT_AMOUNT = 50000; // $50,000

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // Require admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: userRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some(r => r.role === "admin");
    if (!isAdmin) {
      console.error("Non-admin attempted to process payouts:", { userId: user.id, requestId });
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for options
    let body: { payout_ids?: string[]; process_all_due?: boolean; retry_failed?: boolean } = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine, will process all due payouts
    }

    const { payout_ids, process_all_due = true, retry_failed = false } = body;

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured", { requestId });
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().toISOString().split("T")[0];
    let pendingPayouts;

    if (payout_ids && payout_ids.length > 0) {
      // Process specific payouts by ID
      const { data, error } = await supabaseAdmin
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
        .in("id", payout_ids)
        .in("status", retry_failed ? ["scheduled", "failed"] : ["scheduled"])
        .limit(MAX_PAYOUTS_PER_RUN);

      if (error) {
        console.error("Error fetching payouts:", { error, requestId });
        return new Response(JSON.stringify({ error: "Failed to fetch payouts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      pendingPayouts = data;
    } else if (process_all_due) {
      // Process all due payouts
      const statuses = retry_failed ? ["scheduled", "failed"] : ["scheduled"];
      const { data, error } = await supabaseAdmin
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
        .in("status", statuses)
        .lte("scheduled_date", today)
        .limit(MAX_PAYOUTS_PER_RUN)
        .order("scheduled_date", { ascending: true });

      if (error) {
        console.error("Error fetching payouts:", { error, requestId });
        return new Response(JSON.stringify({ error: "Failed to fetch payouts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      pendingPayouts = data;
    } else {
      return new Response(JSON.stringify({ error: "No payouts specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingPayouts || pendingPayouts.length === 0) {
      return new Response(JSON.stringify({
        processed: 0,
        failed: 0,
        skipped: 0,
        message: "No payouts to process",
        requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{
      payout_id: string;
      status: "completed" | "failed" | "skipped";
      amount?: number;
      recipient_user_id?: string;
      error?: string;
      stripe_transfer_id?: string;
    }> = [];

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const payout of pendingPayouts) {
      try {
        // Validate amount
        if (typeof payout.amount !== 'number' || payout.amount <= 0) {
          results.push({
            payout_id: payout.id,
            status: "failed",
            error: "Invalid payout amount",
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
          results.push({
            payout_id: payout.id,
            status: "failed",
            amount: payout.amount,
            error: `Exceeds safety limit of $${MAX_PAYOUT_AMOUNT}`,
          });

          await supabaseAdmin
            .from("scheduled_payouts")
            .update({
              status: "failed",
              failure_reason: `Payout amount $${payout.amount} exceeds safety limit`,
            })
            .eq("id", payout.id);

          failed++;
          continue;
        }

        // Verify escrow has sufficient funds
        const escrow = payout.escrow;
        if (!escrow || (escrow.held_amount || 0) < payout.amount) {
          results.push({
            payout_id: payout.id,
            status: "failed",
            amount: payout.amount,
            error: `Insufficient escrow funds (held: $${escrow?.held_amount || 0})`,
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

        if (!stripeAccount || stripeAccount.user_id !== payout.recipient_user_id) {
          results.push({
            payout_id: payout.id,
            status: "skipped",
            amount: payout.amount,
            recipient_user_id: payout.recipient_user_id,
            error: "Recipient has no connected Stripe account",
          });

          // Don't mark as failed - just skip so it can be retried later
          skipped++;
          continue;
        }

        if (!stripeAccount.payouts_enabled) {
          results.push({
            payout_id: payout.id,
            status: "skipped",
            amount: payout.amount,
            recipient_user_id: payout.recipient_user_id,
            error: "Recipient Stripe payouts not enabled (onboarding incomplete)",
          });

          // Don't mark as failed - just skip so it can be retried later
          skipped++;
          continue;
        }

        // Create transfer to connected account
        const idempotencyKey = `admin_payout_${payout.id}_${requestId}`;
        const amountInCents = Math.round(payout.amount * 100);

        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: "usd",
          destination: stripeAccount.stripe_account_id,
          metadata: {
            payout_id: payout.id,
            escrow_id: payout.escrow_id,
            payout_type: payout.payout_type,
            processed_by: user.id,
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

        results.push({
          payout_id: payout.id,
          status: "completed",
          amount: payout.amount,
          recipient_user_id: payout.recipient_user_id,
          stripe_transfer_id: transfer.id,
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
            failure_reason: message.substring(0, 500),
          })
          .eq("id", payout.id);

        results.push({
          payout_id: payout.id,
          status: "failed",
          amount: payout.amount,
          error: message,
        });

        failed++;
      }
    }

    return new Response(JSON.stringify({
      processed,
      failed,
      skipped,
      total: pendingPayouts.length,
      results,
      processed_by: user.id,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin payout processing error:", { error: message, requestId });

    return new Response(JSON.stringify({
      error: "Payout processing failed",
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
