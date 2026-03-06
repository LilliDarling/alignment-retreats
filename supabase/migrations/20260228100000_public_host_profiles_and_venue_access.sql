-- Allow get_public_profiles to return basic profile info without auth
-- Host names and profile photos must be visible on public retreat pages
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(id uuid, name character varying, bio text, profile_photo character varying)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
$$;

-- Also update single-profile version
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(id uuid, name character varying, bio text, profile_photo character varying)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = profile_id
$$;

-- Grant anon access to properties_public view so unauthenticated users can see venue info
GRANT SELECT ON public.properties_public TO anon;
