-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view public profile info" ON public.profiles;

-- Keep only the policy allowing users to view their own full profile
-- "Users can view own profile" already exists from previous migration

-- Create a security definer function to get public profile info without email
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar,
  bio text,
  profile_photo varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = profile_id
$$;

-- Create a function to get multiple public profiles (for listing hosts, cohosts, etc.)
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE (
  id uuid,
  name varchar,
  bio text,
  profile_photo varchar
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
$$;