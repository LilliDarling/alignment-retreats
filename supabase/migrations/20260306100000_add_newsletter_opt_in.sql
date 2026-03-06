-- Add newsletter opt-in column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN NOT NULL DEFAULT false;
