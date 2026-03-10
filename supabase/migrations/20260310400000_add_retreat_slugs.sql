-- Add slug column for pretty retreat URLs (/retreats/7-day-yoga-retreat)
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS slug varchar UNIQUE;

-- Slugify function already exists from profile slugs migration

-- Helper: generate a unique retreat slug (separate namespace from profiles)
CREATE OR REPLACE FUNCTION public.generate_unique_retreat_slug(base_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  counter int := 0;
BEGIN
  base_slug := public.slugify(base_title);
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'retreat';
  END IF;
  candidate := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.retreats WHERE slug = candidate) THEN
      RETURN candidate;
    END IF;
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;
END;
$$;

-- Populate slugs for existing retreats
UPDATE public.retreats
SET slug = public.generate_unique_retreat_slug(COALESCE(title, 'retreat'))
WHERE slug IS NULL;

-- Make slug NOT NULL now that all rows have one
ALTER TABLE public.retreats ALTER COLUMN slug SET NOT NULL;

-- Trigger: auto-generate slug on INSERT or when title changes
CREATE OR REPLACE FUNCTION public.set_retreat_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.slug IS NULL THEN
    NEW.slug := public.generate_unique_retreat_slug(COALESCE(NEW.title, 'retreat'));
  ELSIF TG_OP = 'UPDATE' AND NEW.title IS DISTINCT FROM OLD.title THEN
    NEW.slug := public.generate_unique_retreat_slug(COALESCE(NEW.title, 'retreat'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_retreat_slug ON public.retreats;
CREATE TRIGGER trigger_set_retreat_slug
  BEFORE INSERT OR UPDATE ON public.retreats
  FOR EACH ROW EXECUTE FUNCTION public.set_retreat_slug();
