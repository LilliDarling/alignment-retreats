-- Add verified column to cohosts table
ALTER TABLE public.cohosts ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add verified column to staff_profiles table
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add price_min and price_max to hosts table for consistency
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS min_rate numeric;
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS max_rate numeric;

-- Add min/max rates to cohosts
ALTER TABLE public.cohosts ADD COLUMN IF NOT EXISTS min_rate numeric;
ALTER TABLE public.cohosts ADD COLUMN IF NOT EXISTS max_rate numeric;

-- Add min/max rates to staff_profiles  
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS min_rate numeric;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS max_rate numeric;

-- Create security definer function to check if current user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hosts WHERE user_id = _user_id AND verified = true
    UNION
    SELECT 1 FROM public.cohosts WHERE user_id = _user_id AND verified = true
    UNION
    SELECT 1 FROM public.staff_profiles WHERE user_id = _user_id AND verified = true
  )
$$;

-- Create a view for directory listings
CREATE OR REPLACE VIEW public.directory_profiles AS
SELECT 
  p.id,
  p.name,
  p.profile_photo,
  p.bio,
  ARRAY(
    SELECT ur.role::text 
    FROM public.user_roles ur 
    WHERE ur.user_id = p.id
  ) as roles,
  -- Host data
  h.verified as host_verified,
  h.expertise_areas,
  h.rating as host_rating,
  h.past_retreats_count,
  h.min_rate as host_min_rate,
  h.max_rate as host_max_rate,
  -- Cohost data
  c.verified as cohost_verified,
  c.skills,
  c.hourly_rate as cohost_hourly_rate,
  c.min_rate as cohost_min_rate,
  c.max_rate as cohost_max_rate,
  c.rating as cohost_rating,
  c.availability as cohost_availability,
  c.past_collaborations_count,
  -- Staff data
  s.verified as staff_verified,
  s.service_type,
  s.day_rate as staff_day_rate,
  s.min_rate as staff_min_rate,
  s.max_rate as staff_max_rate,
  s.rating as staff_rating,
  s.experience_years,
  s.availability as staff_availability,
  s.portfolio_url,
  -- Computed fields
  COALESCE(h.verified, false) OR COALESCE(c.verified, false) OR COALESCE(s.verified, false) as is_verified
FROM public.profiles p
LEFT JOIN public.hosts h ON h.user_id = p.id
LEFT JOIN public.cohosts c ON c.user_id = p.id
LEFT JOIN public.staff_profiles s ON s.user_id = p.id
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  AND ur.role IN ('host', 'cohost', 'staff')
);

-- Create RLS policy for the view to allow all authenticated users to read
-- (pricing visibility will be handled in the frontend based on viewer verification status)