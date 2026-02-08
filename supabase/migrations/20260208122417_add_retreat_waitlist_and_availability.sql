-- ============================================================
-- Retreat Waitlist table + Availability RPCs
-- ============================================================

-- 1. retreat_waitlist table
CREATE TABLE public.retreat_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id UUID NOT NULL REFERENCES public.retreats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "position" INTEGER NOT NULL,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (retreat_id, user_id)
);

ALTER TABLE public.retreat_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
ON public.retreat_waitlist FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Hosts can view waitlist for their retreats
CREATE POLICY "Hosts can view waitlist for their retreats"
ON public.retreat_waitlist FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.retreats r
  WHERE r.id = retreat_waitlist.retreat_id
  AND r.host_user_id = auth.uid()
));

-- Admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries"
ON public.retreat_waitlist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can join waitlist (position set by RPC)
CREATE POLICY "Users can join waitlist"
ON public.retreat_waitlist FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can leave waitlist
CREATE POLICY "Users can leave waitlist"
ON public.retreat_waitlist FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. get_retreat_availability RPC
-- SECURITY DEFINER bypasses bookings RLS to return safe aggregate counts
CREATE OR REPLACE FUNCTION public.get_retreat_availability(retreat_ids UUID[])
RETURNS TABLE(
  retreat_id UUID,
  max_attendees INTEGER,
  current_bookings BIGINT,
  spots_remaining INTEGER,
  is_full BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS retreat_id,
    r.max_attendees,
    COUNT(b.id) AS current_bookings,
    CASE
      WHEN r.max_attendees IS NULL THEN NULL
      ELSE GREATEST(0, r.max_attendees - COUNT(b.id)::integer)
    END AS spots_remaining,
    CASE
      WHEN r.max_attendees IS NULL THEN false
      ELSE COUNT(b.id) >= r.max_attendees
    END AS is_full
  FROM public.retreats r
  LEFT JOIN public.bookings b ON b.retreat_id = r.id
  WHERE r.id = ANY(retreat_ids)
  GROUP BY r.id, r.max_attendees
$$;

-- 3. join_retreat_waitlist RPC
-- Handles position assignment atomically
CREATE OR REPLACE FUNCTION public.join_retreat_waitlist(_retreat_id UUID)
RETURNS TABLE(
  waitlist_id UUID,
  "position" INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _max_position INTEGER;
  _new_position INTEGER;
  _new_id UUID;
BEGIN
  -- Verify authentication
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Verify retreat exists and is published
  IF NOT EXISTS (
    SELECT 1 FROM public.retreats WHERE id = _retreat_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Retreat not found or not available' USING ERRCODE = 'P0002';
  END IF;

  -- Verify user doesn't already have a booking
  IF EXISTS (
    SELECT 1 FROM public.bookings WHERE retreat_id = _retreat_id AND attendee_user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'You already have a booking for this retreat' USING ERRCODE = '23505';
  END IF;

  -- Get next position
  SELECT COALESCE(MAX(w."position"), 0) INTO _max_position
  FROM public.retreat_waitlist w
  WHERE w.retreat_id = _retreat_id;

  _new_position := _max_position + 1;

  INSERT INTO public.retreat_waitlist (retreat_id, user_id, "position")
  VALUES (_retreat_id, _user_id, _new_position)
  RETURNING id INTO _new_id;

  RETURN QUERY SELECT _new_id, _new_position;
END;
$$;
