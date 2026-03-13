-- Create venue-photos storage bucket (upload code references this bucket
-- but it was never created — only property-photos/property-videos exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view venue photos
CREATE POLICY "Anyone can view venue photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'venue-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload venue photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own venue photos
CREATE POLICY "Users can update own venue photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own venue photos
CREATE POLICY "Users can delete own venue photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
