-- Add co-op membership flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_coop_member BOOLEAN DEFAULT false;

-- Allow public (anon) access to published venues
CREATE POLICY "Anyone can view published properties"
  ON public.properties FOR SELECT
  TO anon
  USING (status = 'published');
