-- Drop the existing policy that exposes payment data to hosts
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Create a policy that only allows attendees to see their own bookings (with payment info)
CREATE POLICY "Attendees can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = attendee_user_id);

-- Create a security definer function for hosts to view bookings without payment data
CREATE OR REPLACE FUNCTION public.get_host_bookings(host_id uuid)
RETURNS TABLE (
  id uuid,
  retreat_id uuid,
  attendee_user_id uuid,
  booking_date timestamptz
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
    b.booking_date
  FROM public.bookings b
  INNER JOIN public.retreats r ON r.id = b.retreat_id
  WHERE r.host_user_id = host_id
$$;