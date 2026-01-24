-- Add new columns to properties table for enhanced landowner onboarding
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_name VARCHAR;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_email VARCHAR;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS content_status VARCHAR;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS existing_content_link TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS content_description TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS interested_in_residency BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS residency_available_dates TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_features TEXT[] DEFAULT '{}'::text[];