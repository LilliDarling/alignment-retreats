-- Fix waitlist table: Add explicit DENY for anonymous users to prevent any public access
-- The table already has "Admins can view waitlist" policy, but needs explicit deny for anon

CREATE POLICY "Anonymous users cannot view waitlist" 
ON public.waitlist 
FOR SELECT 
TO anon 
USING (false);

-- Also add explicit deny for authenticated non-admins to be extra safe
CREATE POLICY "Non-admin authenticated users cannot view waitlist" 
ON public.waitlist 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));