-- Add video support and venue review workflow for properties table

-- 1. Create property-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add videos column to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- 3. Add status column for admin review workflow
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending_review';

-- Update existing properties to 'published' status
UPDATE public.properties
SET status = 'published'
WHERE status IS NULL;

-- 4. Create venue inquiries table for potential renters to contact venue owners
CREATE TABLE IF NOT EXISTS public.venue_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  inquirer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  preferred_dates TEXT,
  guest_count INTEGER,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Storage policies for property-videos bucket
CREATE POLICY "Anyone can view property videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-videos');

CREATE POLICY "Users can upload property videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own property videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own property videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Enable RLS on venue_inquiries table
ALTER TABLE public.venue_inquiries ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for venue_inquiries
CREATE POLICY "Users can view own inquiries"
  ON public.venue_inquiries FOR SELECT
  USING (inquirer_user_id = auth.uid());

CREATE POLICY "Property owners can view inquiries for their venues"
  ON public.venue_inquiries FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create inquiries"
  ON public.venue_inquiries FOR INSERT
  WITH CHECK (auth.uid() = inquirer_user_id);

-- 8. Create index for faster queries on venue_inquiries
CREATE INDEX IF NOT EXISTS venue_inquiries_property_id_idx ON public.venue_inquiries(property_id);
CREATE INDEX IF NOT EXISTS venue_inquiries_inquirer_user_id_idx ON public.venue_inquiries(inquirer_user_id);
CREATE INDEX IF NOT EXISTS venue_inquiries_created_at_idx ON public.venue_inquiries(created_at DESC);

-- 9. Create index for properties status for efficient filtering
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status) WHERE status = 'published';

-- 10. Add trigger to update updated_at timestamp on venue_inquiries
CREATE OR REPLACE FUNCTION update_venue_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_inquiry_updated_at
  BEFORE UPDATE ON public.venue_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_inquiry_updated_at();
