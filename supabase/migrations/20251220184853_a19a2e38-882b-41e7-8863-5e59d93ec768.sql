-- Create waitlist table for pre-launch signups
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  interested_roles text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup form)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can view (you can view via Cloud backend)
CREATE POLICY "Admins can view waitlist" ON public.waitlist
  FOR SELECT USING (auth.uid() IS NOT NULL);