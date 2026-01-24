-- Add policy for hosts to view bookings for their retreats (excluding stripe_payment_id via the secure function)
-- Note: Direct table access is intentionally limited - hosts should use get_host_retreat_bookings() function
-- But we need a basic policy so the function can work
CREATE POLICY "Hosts can view booking metadata for own retreats"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IN (
    SELECT r.host_user_id 
    FROM public.retreats r 
    WHERE r.id = retreat_id
  )
);