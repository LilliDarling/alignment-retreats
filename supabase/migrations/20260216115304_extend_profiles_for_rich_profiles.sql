-- Extend profiles table for rich user profiles
ALTER TABLE public.profiles
  -- Role and expertise
  ADD COLUMN IF NOT EXISTS user_roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio TEXT,
  
  -- What they offer and want
  ADD COLUMN IF NOT EXISTS what_i_offer TEXT,
  ADD COLUMN IF NOT EXISTS what_im_looking_for TEXT,
  
  -- Portfolio and media
  ADD COLUMN IF NOT EXISTS profile_photo TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_videos TEXT[] DEFAULT '{}',
  
  -- Professional details
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT, -- 'available', 'limited', 'unavailable'
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS daily_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS rate_currency TEXT DEFAULT 'USD',
  
  -- Social proof and verification
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_followers INTEGER,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  
  -- Additional info
  ADD COLUMN IF NOT EXISTS certifications TEXT[],
  ADD COLUMN IF NOT EXISTS languages TEXT[],
  ADD COLUMN IF NOT EXISTS travel_willing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for search/filter performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_roles ON profiles USING GIN(user_roles);
CREATE INDEX IF NOT EXISTS idx_profiles_expertise_areas ON profiles USING GIN(expertise_areas);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_availability_status ON profiles(availability_status);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for portfolio media
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
CREATE POLICY "Users can upload own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
CREATE POLICY "Users can update own profile photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
CREATE POLICY "Users can delete own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for portfolio media
DROP POLICY IF EXISTS "Anyone can view portfolio media" ON storage.objects;
CREATE POLICY "Anyone can view portfolio media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Users can upload own portfolio media" ON storage.objects;
CREATE POLICY "Users can upload own portfolio media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own portfolio media" ON storage.objects;
CREATE POLICY "Users can update own portfolio media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own portfolio media" ON storage.objects;
CREATE POLICY "Users can delete own portfolio media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comments
COMMENT ON COLUMN profiles.user_roles IS 'Array of roles: host, cohost, chef, photographer, yoga_instructor, etc.';
COMMENT ON COLUMN profiles.expertise_areas IS 'Areas of expertise: Yoga, Meditation, Breathwork, Sound Healing, etc.';
COMMENT ON COLUMN profiles.profile_photo IS 'URL to profile photo in storage';
COMMENT ON COLUMN profiles.portfolio_photos IS 'Array of portfolio photo URLs';
COMMENT ON COLUMN profiles.portfolio_videos IS 'Array of portfolio video URLs';
COMMENT ON COLUMN profiles.availability_status IS 'Current availability: available, limited, unavailable';
