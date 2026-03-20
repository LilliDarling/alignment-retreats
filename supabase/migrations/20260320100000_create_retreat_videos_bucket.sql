-- Create dedicated retreat-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('retreat-videos', 'retreat-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view retreat videos
CREATE POLICY "Public read retreat videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'retreat-videos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload retreat videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'retreat-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own retreat videos
CREATE POLICY "Users can update own retreat videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'retreat-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own retreat videos
CREATE POLICY "Users can delete own retreat videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'retreat-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
