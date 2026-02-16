-- Retreat status lifecycle: pending_review → approved → published → cancelled
-- Add 'approved' status and remove unused 'full' and 'completed' statuses.
-- Set up granular SELECT policies by status.

-- Step 1: Add 'approved' to enum (must be committed separately in Supabase SQL editor)
ALTER TYPE retreat_status ADD VALUE IF NOT EXISTS 'approved';

-- Step 2: Migrate existing data
UPDATE public.retreats SET status = 'pending_review' WHERE status = 'draft';
UPDATE public.retreats SET status = 'published' WHERE status = 'full';
UPDATE public.retreats SET status = 'published' WHERE status = 'completed';

-- Step 3: Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.user_has_booking_for_retreat(retreat_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.retreat_id = retreat_uuid
      AND bookings.attendee_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_retreat_team_member(retreat_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.retreat_team
    WHERE retreat_team.retreat_id = retreat_uuid
      AND retreat_team.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_retreat_host(retreat_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.retreats
    WHERE id = retreat_uuid
      AND host_user_id = auth.uid()
  );
$$;

-- Step 4: Drop old SELECT policies
DROP POLICY IF EXISTS "Anyone can view published retreats or admins see all" ON public.retreats;
DROP POLICY IF EXISTS "Anyone can view published retreats" ON public.retreats;
DROP POLICY IF EXISTS "Users can view their own retreats" ON public.retreats;

-- Step 5: Create granular SELECT policies

-- Published retreats: visible to everyone (including anonymous)
CREATE POLICY "Anyone can view published retreats"
ON public.retreats
FOR SELECT
USING (status = 'published'::retreat_status);

-- Pending review: only the submitter and admins
CREATE POLICY "Submitter and admins can view pending retreats"
ON public.retreats
FOR SELECT
USING (
  status = 'pending_review'::retreat_status
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid() = host_user_id
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Approved: anyone with a non-attendee role (host, cohost, landowner, staff) + admins
CREATE POLICY "Collaborators can view approved retreats"
ON public.retreats
FOR SELECT
USING (
  status = 'approved'::retreat_status
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'host'::app_role)
    OR has_role(auth.uid(), 'cohost'::app_role)
    OR has_role(auth.uid(), 'landowner'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);

-- Cancelled: only admins
CREATE POLICY "Admins can view cancelled retreats"
ON public.retreats
FOR SELECT
USING (
  status = 'cancelled'::retreat_status
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Users can always see retreats they're directly involved with
CREATE POLICY "Users can view retreats they are involved with"
ON public.retreats
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = host_user_id
    OR user_has_booking_for_retreat(id)
    OR user_is_retreat_team_member(id)
  )
);

-- Step 6: Update policies
DROP POLICY IF EXISTS "Hosts can update own retreats" ON public.retreats;

CREATE POLICY "Hosts can update own non-cancelled retreats"
ON public.retreats
FOR UPDATE
USING (
  auth.uid() = host_user_id
  AND status != 'cancelled'::retreat_status
)
WITH CHECK (
  auth.uid() = host_user_id
  AND status != 'cancelled'::retreat_status
);

CREATE POLICY "Admins can update any retreat"
ON public.retreats
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 7: Fix retreat_waitlist host policy to avoid RLS recursion
DROP POLICY IF EXISTS "Hosts can view waitlist for their retreats" ON public.retreat_waitlist;

CREATE POLICY "Hosts can view waitlist for their retreats"
ON public.retreat_waitlist FOR SELECT
TO authenticated
USING (user_is_retreat_host(retreat_id));
