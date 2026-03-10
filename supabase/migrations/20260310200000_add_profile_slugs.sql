-- Add slug column for pretty profile URLs (/profile/john-doe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug varchar UNIQUE;

-- Helper: generate a slug from a name
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT regexp_replace(
    regexp_replace(
      lower(trim(input)),
      '[^a-z0-9\s-]', '', 'g'   -- strip non-alphanumeric
    ),
    '[\s-]+', '-', 'g'           -- collapse whitespace/hyphens
  )
$$;

-- Helper: generate a unique slug, appending a short suffix on collision
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  counter int := 0;
BEGIN
  base_slug := public.slugify(base_name);
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'user';
  END IF;
  candidate := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = candidate) THEN
      RETURN candidate;
    END IF;
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;
END;
$$;

-- Populate slugs for existing profiles
UPDATE public.profiles
SET slug = public.generate_unique_slug(COALESCE(name, 'user'))
WHERE slug IS NULL;

-- Make slug NOT NULL now that all rows have one
ALTER TABLE public.profiles ALTER COLUMN slug SET NOT NULL;

-- Trigger: auto-generate slug on INSERT or when name changes
CREATE OR REPLACE FUNCTION public.set_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.slug IS NULL THEN
    NEW.slug := public.generate_unique_slug(COALESCE(NEW.name, 'user'));
  ELSIF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.slug := public.generate_unique_slug(COALESCE(NEW.name, 'user'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_profile_slug ON public.profiles;
CREATE TRIGGER trigger_set_profile_slug
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_slug();

-- RPC: look up a public profile by slug (SECURITY DEFINER bypasses RLS for anonymous access)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(profile_slug text)
RETURNS TABLE(
  id uuid,
  name character varying,
  slug character varying,
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
    p.slug,
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
  WHERE p.slug = profile_slug
$$;

-- Also add slug to the existing RPCs
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  name character varying,
  slug character varying,
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
    p.slug,
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

-- Update the plural version too (used by retreat detail pages)
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(
  id uuid,
  name character varying,
  slug character varying,
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
    p.slug,
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
