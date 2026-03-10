-- Add pending_review to retreat_status enum
ALTER TYPE public.retreat_status ADD VALUE IF NOT EXISTS 'pending_review' BEFORE 'published';

-- Add description column for richer retreat detail (markdown-friendly)
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS what_to_bring text;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS location_details text;
