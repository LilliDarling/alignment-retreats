-- Add MySpace-style customization fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT '#8B5CF6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_song_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_effects VARCHAR(20) DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about_me_html TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS layout_style VARCHAR(20) DEFAULT 'modern';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_in_directory BOOLEAN DEFAULT true;

-- Track onboarding completion per role (stores JSON like {"host": true, "cohost": false})
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed JSONB DEFAULT '{}'::jsonb;