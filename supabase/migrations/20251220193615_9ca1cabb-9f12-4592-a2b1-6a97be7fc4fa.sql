-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- Recreate with explicit TO authenticated requirement
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);