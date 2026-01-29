-- Update get_payout_breakdown to include retreat_team_id for payout scheduling.
-- Must DROP first because CREATE OR REPLACE cannot change the return type.
DROP FUNCTION IF EXISTS public.get_payout_breakdown(UUID);

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
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date)
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date)
      ELSE 0
    END as amount,
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as deposit_amount,
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as final_amount
  FROM public.bookings b
  JOIN public.retreats r ON r.id = b.retreat_id
  JOIN public.retreat_team rt ON rt.retreat_id = r.id AND rt.agreed = true
  JOIN public.profiles p ON p.id = rt.user_id
  WHERE b.id = _booking_id
$$;
