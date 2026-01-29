-- Update get_payout_breakdown to include retreat_team_id for payout scheduling.
-- Must DROP first because CREATE OR REPLACE cannot change the return type.
DROP FUNCTION IF EXISTS public.get_payout_breakdown(UUID);

-- Calculate payout amounts for retreat team members based on a specific booking.
-- Fee types:
--   'flat' - Fixed amount regardless of attendees or duration
--   'per_person' - Amount multiplied by 1 (this booking represents one attendee)
--   'per_night' - Amount multiplied by retreat duration in nights
--   'per_person_per_night' - Amount multiplied by 1 attendee * nights
-- Note: Each booking = 1 attendee. For per_person fees, this calculates the
-- team member's share for THIS booking only. The function is called once per
-- checkout.session.completed event (i.e., once per booking/attendee).
CREATE FUNCTION public.get_payout_breakdown(
  _booking_id UUID
)
RETURNS TABLE(
  retreat_team_id UUID,
  recipient_user_id UUID,
  recipient_name VARCHAR,
  role team_member_role,
  amount NUMERIC,
  deposit_amount NUMERIC,
  final_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rt.id as retreat_team_id,
    rt.user_id as recipient_user_id,
    p.name as recipient_name,
    rt.role,
    -- Calculate total amount for this booking (1 attendee)
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount
      WHEN 'per_person' THEN rt.fee_amount  -- 1 attendee per booking
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date)
      WHEN 'per_person_per_night' THEN rt.fee_amount * (r.end_date - r.start_date)  -- 1 attendee * nights
      ELSE 0
    END as amount,
    -- Deposit is 50% of total, paid immediately
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as deposit_amount,
    -- Final payment is remaining 50%, paid 1 week before retreat
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as final_amount
  FROM public.bookings b
  JOIN public.retreats r ON r.id = b.retreat_id
  JOIN public.retreat_team rt ON rt.retreat_id = r.id AND rt.agreed = true
  JOIN public.profiles p ON p.id = rt.user_id
  WHERE b.id = _booking_id
$$;
