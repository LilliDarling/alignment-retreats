-- Drop existing restrictive policies on bookings
DROP POLICY IF EXISTS "Attendees can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Attendees can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Attendees can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Hosts can view bookings for their retreats" ON public.bookings;

-- Recreate as PERMISSIVE policies (default behavior)
-- Attendees can view their own bookings
CREATE POLICY "Attendees can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = attendee_user_id);

-- Hosts can view bookings for their retreats
CREATE POLICY "Hosts can view bookings for their retreats"
ON public.bookings FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM retreats r
  WHERE r.id = bookings.retreat_id 
  AND r.host_user_id = auth.uid()
));

-- Attendees can create their own bookings
CREATE POLICY "Attendees can create bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = attendee_user_id);

-- Attendees can update their own bookings
CREATE POLICY "Attendees can update own bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = attendee_user_id);