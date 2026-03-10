-- Add gallery columns to retreats
ALTER TABLE public.retreats
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gallery_videos TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.retreats.gallery_images IS 'Array of gallery image URLs';
COMMENT ON COLUMN public.retreats.gallery_videos IS 'Array of gallery video URLs';
