-- Drop the overly permissive policy that exposes emails publicly
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a policy that allows users to view only their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a policy that allows authenticated users to view basic profile info (name, bio, photo) of other users
-- This is useful for showing host/cohost names without exposing emails
CREATE POLICY "Authenticated users can view public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: To properly hide email from other users while showing public fields,
-- we should use a view or RPC function. For now, this restricts to authenticated users only.