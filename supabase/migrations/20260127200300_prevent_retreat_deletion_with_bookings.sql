-- Prevent retreat deletion when bookings exist.
-- The original CASCADE silently wipes bookings, escrow accounts,
-- booking payments, and scheduled payouts — all financial records.
-- RESTRICT blocks the delete and raises an error instead.

ALTER TABLE public.bookings
  DROP CONSTRAINT bookings_retreat_id_fkey,
  ADD CONSTRAINT bookings_retreat_id_fkey
    FOREIGN KEY (retreat_id) REFERENCES public.retreats(id) ON DELETE RESTRICT;
