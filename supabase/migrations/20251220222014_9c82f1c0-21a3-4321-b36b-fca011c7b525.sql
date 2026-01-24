-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Authenticated users can join waitlist" ON public.waitlist;

-- Create a secure function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Create a tighter INSERT policy that validates users can only insert their own email
CREATE POLICY "Authenticated users can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email = public.get_auth_email()
);