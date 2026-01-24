-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that explicitly requires authentication AND owns the profile
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);