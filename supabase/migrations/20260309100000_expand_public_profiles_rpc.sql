-- Expand get_public_profiles to return full public profile info
-- This powers the host profile modal on retreat detail pages
-- SECURITY DEFINER bypasses RLS so anonymous users can see host profiles
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(
  id uuid,
  name character varying,
  bio text,
  profile_photo character varying,
  location character varying,
  expertise_areas text[],
  certifications text[],
  languages text[],
  years_experience integer,
  availability_status character varying,
  what_i_offer text,
  instagram_handle character varying,
  website_url character varying,
  verified boolean,
  travel_willing boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.bio,
    p.profile_photo,
    p.location,
    p.expertise_areas,
    p.certifications,
    p.languages,
    p.years_experience,
    p.availability_status,
    p.what_i_offer,
    p.instagram_handle,
    p.website_url,
    p.verified,
    p.travel_willing
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
$$;

-- Also expand the single-profile version
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  name character varying,
  bio text,
  profile_photo character varying,
  location character varying,
  expertise_areas text[],
  certifications text[],
  languages text[],
  years_experience integer,
  availability_status character varying,
  what_i_offer text,
  instagram_handle character varying,
  website_url character varying,
  verified boolean,
  travel_willing boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.name,
    p.bio,
    p.profile_photo,
    p.location,
    p.expertise_areas,
    p.certifications,
    p.languages,
    p.years_experience,
    p.availability_status,
    p.what_i_offer,
    p.instagram_handle,
    p.website_url,
    p.verified,
    p.travel_willing
  FROM public.profiles p
  WHERE p.id = profile_id
$$;
