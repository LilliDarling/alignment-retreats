-- Reset all false verifications and fake ratings
UPDATE public.hosts SET verified = false, rating = null;
UPDATE public.cohosts SET verified = false, rating = null;
UPDATE public.staff_profiles SET verified = false, rating = null;

-- Add admin update policies for verification management
CREATE POLICY "Admins can update host verification"
ON public.hosts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cohost verification"
ON public.cohosts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update staff verification"
ON public.staff_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));