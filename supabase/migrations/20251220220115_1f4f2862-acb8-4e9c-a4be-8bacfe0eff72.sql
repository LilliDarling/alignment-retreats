-- Drop the overly permissive INSERT policy on waitlist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Create a more restrictive policy - only authenticated users can insert
-- (or you could require admin to add waitlist entries)
CREATE POLICY "Authenticated users can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);