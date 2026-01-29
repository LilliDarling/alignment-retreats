-- Prevent duplicate bookings at the database level
ALTER TABLE public.bookings
  ADD CONSTRAINT unique_booking_per_retreat_attendee
  UNIQUE (retreat_id, attendee_user_id);

-- Prevent overbooking via trigger with row-level locking
CREATE OR REPLACE FUNCTION public.check_booking_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Lock the retreat row to serialize concurrent booking attempts.
  -- Any other INSERT for the same retreat will wait here until this
  -- transaction commits or rolls back, preventing race conditions.
  SELECT max_attendees INTO max_allowed
  FROM public.retreats
  WHERE id = NEW.retreat_id
  FOR UPDATE;

  -- If no limit is set, allow booking
  IF max_allowed IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count existing bookings (this row hasn't been inserted yet)
  SELECT COUNT(*) INTO current_count
  FROM public.bookings
  WHERE retreat_id = NEW.retreat_id;

  -- Reject if at capacity
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'This retreat is fully booked (% of % spots taken)',
      current_count, max_allowed
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_booking_capacity
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_capacity();
