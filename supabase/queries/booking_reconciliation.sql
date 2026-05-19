-- Booking purchase reconciliation
--
-- Finds bookings / payments / escrow / payouts in inconsistent states
-- caused by the stripe-webhook handler swallowing per-step errors.
-- Each row of output represents one suspicious record with an `issue` label.
--
-- Grace period: 10 minutes — rows fresher than this may still be mid-webhook.
-- Adjust the INTERVAL in `cfg` if you want a tighter or looser window.
--
-- Paste into Supabase SQL Editor. Empty result = nothing wrong.

WITH cfg AS (
  SELECT NOW() - INTERVAL '10 minutes' AS cutoff
)

-- 1. Booking exists but no booking_payments row at all.
--    Stripe charged the customer, but the webhook never wrote the payment record.
SELECT
  b.id              AS booking_id,
  b.retreat_id,
  b.attendee_user_id,
  b.booking_date,
  'missing_payment_record'::text AS issue,
  'booking has no row in booking_payments'::text AS details
FROM public.bookings b
LEFT JOIN public.booking_payments bp ON bp.booking_id = b.id
CROSS JOIN cfg
WHERE bp.id IS NULL
  AND b.booking_date < cfg.cutoff

UNION ALL

-- 2. Payment row exists but is stuck in 'pending'.
--    Webhook started but never marked it completed.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'payment_stuck_pending',
  'payment_status=pending for >10min; webhook may not have completed'
FROM public.bookings b
JOIN public.booking_payments bp ON bp.booking_id = b.id
CROSS JOIN cfg
WHERE bp.payment_status = 'pending'
  AND bp.created_at < cfg.cutoff

UNION ALL

-- 3. Payment marked completed but no escrow_accounts row.
--    Funds in Stripe are not being tracked for release to the host.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'missing_escrow',
  'payment completed but no escrow_accounts row'
FROM public.bookings b
JOIN public.booking_payments bp ON bp.booking_id = b.id
LEFT JOIN public.escrow_accounts ea ON ea.booking_id = b.id
CROSS JOIN cfg
WHERE bp.payment_status = 'completed'
  AND ea.id IS NULL
  AND bp.created_at < cfg.cutoff

UNION ALL

-- 4. Escrow exists but booking_payments.escrow_id was never backfilled.
--    Linkage is broken — payouts can still find escrow, but joins from payments will lie.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'escrow_unlinked_from_payment',
  'escrow_accounts row exists but booking_payments.escrow_id is NULL'
FROM public.bookings b
JOIN public.booking_payments bp ON bp.booking_id = b.id
JOIN public.escrow_accounts ea ON ea.booking_id = b.id
CROSS JOIN cfg
WHERE bp.escrow_id IS NULL
  AND ea.created_at < cfg.cutoff

UNION ALL

-- 5. Escrow is holding funds but no scheduled_payouts rows exist.
--    The host will never be paid unless someone backfills these.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'missing_scheduled_payouts',
  'escrow status=holding but no scheduled_payouts rows'
FROM public.bookings b
JOIN public.escrow_accounts ea ON ea.booking_id = b.id
LEFT JOIN public.scheduled_payouts sp ON sp.escrow_id = ea.id
CROSS JOIN cfg
WHERE ea.status = 'holding'
  AND sp.id IS NULL
  AND ea.created_at < cfg.cutoff

UNION ALL

-- 6. A scheduled payout entered the 'failed' terminal state.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'failed_payout',
  'scheduled_payouts.status=failed: ' || COALESCE(sp.failure_reason, '(no reason)')
FROM public.bookings b
JOIN public.escrow_accounts ea ON ea.booking_id = b.id
JOIN public.scheduled_payouts sp ON sp.escrow_id = ea.id
WHERE sp.status = 'failed'

UNION ALL

-- 7. Payout is past its scheduled_date but still pending/scheduled.
--    The payout job hasn't run, or it's silently skipping rows.
SELECT
  b.id, b.retreat_id, b.attendee_user_id, b.booking_date,
  'overdue_pending_payout',
  'payout scheduled ' || sp.scheduled_date::text
    || ' for ' || sp.payout_type
    || ' still ' || sp.status::text
FROM public.bookings b
JOIN public.escrow_accounts ea ON ea.booking_id = b.id
JOIN public.scheduled_payouts sp ON sp.escrow_id = ea.id
WHERE sp.status IN ('pending', 'scheduled')
  AND sp.scheduled_date < CURRENT_DATE

ORDER BY booking_date DESC, issue;
