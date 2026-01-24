-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Role-based profile visibility" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);