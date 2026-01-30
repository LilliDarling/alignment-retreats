import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse query params from URL
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // scheduled, failed, completed, all
    const retreatId = url.searchParams.get("retreat_id");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Build query - fetch payouts with related data
    let query = supabaseAdmin
      .from("scheduled_payouts")
      .select(`
        *,
        escrow:escrow_accounts(
          id,
          booking_id,
          total_amount,
          held_amount,
          released_amount,
          platform_fee,
          status,
          booking:bookings(
            id,
            retreat:retreats(
              id,
              title,
              start_date
            )
          )
        )
      `)
      .order("scheduled_date", { ascending: true })
      .limit(limit);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Note: retreat_id filter would need a join, so we filter in memory if needed

    const { data: payouts, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching payouts:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch payouts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter by retreat_id if specified
    let filteredPayouts = payouts || [];
    if (retreatId) {
      filteredPayouts = filteredPayouts.filter(p =>
        p.escrow?.booking?.retreat?.id === retreatId
      );
    }

    // Get recipient profiles and stripe account status for each payout
    const recipientIds = [...new Set(filteredPayouts.map(p => p.recipient_user_id).filter(Boolean))];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", recipientIds);

    const { data: stripeAccounts } = await supabaseAdmin
      .from("stripe_connected_accounts")
      .select("user_id, stripe_account_id, payouts_enabled, onboarding_complete")
      .in("user_id", recipientIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const stripeMap = new Map(stripeAccounts?.map(s => [s.user_id, s]) || []);

    // Get summary counts
    const { data: summary } = await supabaseAdmin
      .from("scheduled_payouts")
      .select("status")
      .then(result => {
        if (result.error) return { data: null };
        const counts = {
          scheduled: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
          total: result.data?.length || 0
        };
        result.data?.forEach(p => {
          if (p.status in counts) {
            counts[p.status as keyof typeof counts]++;
          }
        });
        return { data: counts };
      });

    // Calculate totals
    const today = new Date().toISOString().split("T")[0];
    const dueTodayOrEarlier = filteredPayouts.filter(p =>
      p.status === "scheduled" && p.scheduled_date <= today
    );
    const totalDueAmount = dueTodayOrEarlier.reduce((sum, p) => sum + (p.amount || 0), 0);

    return new Response(JSON.stringify({
      payouts: filteredPayouts.map(p => {
        const recipient = profileMap.get(p.recipient_user_id);
        const stripeAccount = stripeMap.get(p.recipient_user_id);

        return {
          id: p.id,
          amount: p.amount,
          payout_type: p.payout_type,
          status: p.status,
          scheduled_date: p.scheduled_date,
          processed_at: p.processed_at,
          failure_reason: p.failure_reason,
          stripe_transfer_id: p.stripe_transfer_id,
          recipient: recipient ? {
            id: recipient.id,
            name: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim(),
            email: recipient.email
          } : { id: p.recipient_user_id, name: "Unknown", email: null },
          stripe_account_connected: !!stripeAccount?.stripe_account_id,
          stripe_payouts_enabled: stripeAccount?.payouts_enabled || false,
          stripe_onboarding_complete: stripeAccount?.onboarding_complete || false,
          retreat: p.escrow?.booking?.retreat ? {
            id: p.escrow.booking.retreat.id,
            title: p.escrow.booking.retreat.title,
            start_date: p.escrow.booking.retreat.start_date
          } : null,
          escrow: p.escrow ? {
            total_amount: p.escrow.total_amount,
            held_amount: p.escrow.held_amount,
            released_amount: p.escrow.released_amount,
            status: p.escrow.status
          } : null
        };
      }),
      summary: {
        ...summary,
        due_today_or_earlier: dueTodayOrEarlier.length,
        total_due_amount: totalDueAmount
      },
      filters_applied: {
        status: status || "all",
        retreat_id: retreatId || null,
        limit
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error listing payouts:", message);

    return new Response(JSON.stringify({ error: "Failed to list payouts" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
