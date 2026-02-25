-- Add co-op membership flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_coop_member BOOLEAN DEFAULT false;

-- Allow admins to update any profile (e.g. toggle co-op membership)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public (anon) access to published venues
CREATE POLICY "Anyone can view published properties"
  ON public.properties FOR SELECT
  TO anon
  USING (status = 'published');
