-- Update get_host_retreat_bookings to join with booking_payments for payment info
-- This function is admin/internal use only
CREATE OR REPLACE FUNCTION public.get_host_retreat_bookings(host_id uuid)
RETURNS TABLE(
  id uuid,
  retreat_id uuid,
  attendee_user_id uuid,
  booking_date timestamp with time zone,
  payment_status text,
  amount_paid numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.retreat_id,
    b.attendee_user_id,
    b.booking_date,
    COALESCE(bp.payment_status::text, 'pending') as payment_status,
    bp.amount_paid
  FROM public.bookings b
  INNER JOIN public.retreats r ON r.id = b.retreat_id
  LEFT JOIN public.booking_payments bp ON bp.booking_id = b.id
  WHERE r.host_user_id = host_id
    AND host_id = auth.uid()  -- Only the host can see their booking payment info
$$;