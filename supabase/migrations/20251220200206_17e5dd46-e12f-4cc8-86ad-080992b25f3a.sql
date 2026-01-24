-- Create a secure function for hosts to view bookings without exposing stripe_payment_id
CREATE OR REPLACE FUNCTION public.get_host_retreat_bookings(host_id uuid)
RETURNS TABLE (
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
    b.payment_status::text,
    b.amount_paid
  FROM public.bookings b
  INNER JOIN public.retreats r ON r.id = b.retreat_id
  WHERE r.host_user_id = host_id
    AND host_id = auth.uid()
$$;

-- Drop the existing host policy that exposes all columns
DROP POLICY IF EXISTS "Hosts can view bookings for own retreats" ON public.bookings;

-- Create a more restrictive policy - hosts can only see bookings through the secure function
-- Attendees can still see their own bookings with full details
-- This effectively removes direct table access for hosts to the bookings table