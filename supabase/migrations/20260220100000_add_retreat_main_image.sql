-- Add main_image column to retreats
ALTER TABLE public.retreats
  ADD COLUMN IF NOT EXISTS main_image TEXT;

COMMENT ON COLUMN public.retreats.main_image IS 'URL of the retreat cover photo';

-- Create retreat-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('retreat-photos', 'retreat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view retreat photos
CREATE POLICY "Public read retreat photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload retreat photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own retreat photos
CREATE POLICY "Users can update own retreat photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own retreat photos
CREATE POLICY "Users can delete own retreat photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
