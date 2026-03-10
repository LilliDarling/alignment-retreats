-- Expand get_public_profile(s) RPCs to include portfolio media, cover photo, tiktok
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(
  id uuid,
  name character varying,
  bio text,
  profile_photo character varying,
  cover_photo character varying,
  location character varying,
  expertise_areas text[],
  certifications text[],
  languages text[],
  years_experience integer,
  availability_status character varying,
  what_i_offer text,
  instagram_handle character varying,
  tiktok_handle character varying,
  website_url character varying,
  portfolio_photos text[],
  portfolio_videos text[],
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
    p.cover_photo,
    p.location,
    p.expertise_areas,
    p.certifications,
    p.languages,
    p.years_experience,
    p.availability_status,
    p.what_i_offer,
    p.instagram_handle,
    p.tiktok_handle,
    p.website_url,
    p.portfolio_photos,
    p.portfolio_videos,
    p.verified,
    p.travel_willing
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
$$;

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  name character varying,
  bio text,
  profile_photo character varying,
  cover_photo character varying,
  location character varying,
  expertise_areas text[],
  certifications text[],
  languages text[],
  years_experience integer,
  availability_status character varying,
  what_i_offer text,
  instagram_handle character varying,
  tiktok_handle character varying,
  website_url character varying,
  portfolio_photos text[],
  portfolio_videos text[],
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
    p.cover_photo,
    p.location,
    p.expertise_areas,
    p.certifications,
    p.languages,
    p.years_experience,
    p.availability_status,
    p.what_i_offer,
    p.instagram_handle,
    p.tiktok_handle,
    p.website_url,
    p.portfolio_photos,
    p.portfolio_videos,
    p.verified,
    p.travel_willing
  FROM public.profiles p
  WHERE p.id = profile_id
$$;
