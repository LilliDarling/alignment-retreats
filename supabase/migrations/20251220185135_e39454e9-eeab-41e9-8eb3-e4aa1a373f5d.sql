-- Add invited_at column for tracking when users are invited to sign up
ALTER TABLE public.waitlist ADD COLUMN invited_at timestamptz;