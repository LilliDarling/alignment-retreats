-- Drop the confusing anonymous blocking policy
-- The RLS is already restrictive by default, so this is redundant
DROP POLICY IF EXISTS "Anonymous users cannot view profiles" ON public.profiles;

-- The existing setup is actually secure:
-- 1. Users can only view/edit their own profile via RLS
-- 2. Admins can view all profiles
-- 3. Public access goes through get_public_profile() SECURITY DEFINER function

-- Add a comment to document the intended access pattern
COMMENT ON TABLE public.profiles IS 'User profiles. Direct access is restricted to own profile. Public profile viewing should use get_public_profile() or get_public_profiles() functions.';