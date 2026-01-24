-- Add policy allowing hosts to view bookings for their own retreats
CREATE POLICY "Hosts can view bookings for own retreats"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT host_user_id FROM public.retreats WHERE id = retreat_id
  )
);