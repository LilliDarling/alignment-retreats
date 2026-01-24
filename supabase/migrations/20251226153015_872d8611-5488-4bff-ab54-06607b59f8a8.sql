-- Add new columns to hosts table for enhanced host profile
ALTER TABLE public.hosts
ADD COLUMN IF NOT EXISTS available_from date,
ADD COLUMN IF NOT EXISTS available_to date,
ADD COLUMN IF NOT EXISTS portfolio_links text,
ADD COLUMN IF NOT EXISTS has_marketing_material boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_description text,
ADD COLUMN IF NOT EXISTS preferred_climates text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_regions text;