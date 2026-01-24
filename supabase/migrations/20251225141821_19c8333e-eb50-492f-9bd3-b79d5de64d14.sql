-- Update get_public_profile to only allow admins or profile owner to view
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(id uuid, name character varying, bio text, profile_photo character varying)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = profile_id
    AND (
      auth.uid() = profile_id  -- Profile owner
      OR has_role(auth.uid(), 'admin'::app_role)  -- Admin
    )
$$;

-- Update get_public_profiles to only allow admins or return only caller's own profile
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE(id uuid, name character varying, bio text, profile_photo character varying)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.name,
    p.bio,
    p.profile_photo
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
    AND (
      auth.uid() = p.id  -- Only own profile
      OR has_role(auth.uid(), 'admin'::app_role)  -- Admins can see all
    )
$$;

-- Update get_directory_profiles to require admin role
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
RETURNS TABLE(id uuid, name character varying, profile_photo character varying, bio text, roles text[], host_verified boolean, expertise_areas text[], host_rating numeric, past_retreats_count integer, host_min_rate numeric, host_max_rate numeric, cohost_verified boolean, skills text[], cohost_hourly_rate numeric, cohost_min_rate numeric, cohost_max_rate numeric, cohost_rating numeric, cohost_availability character varying, past_collaborations_count integer, staff_verified boolean, service_type character varying, staff_day_rate numeric, staff_min_rate numeric, staff_max_rate numeric, staff_rating numeric, experience_years integer, staff_availability character varying, portfolio_url character varying, is_verified boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    h.verified as host_verified,
    h.expertise_areas,
    h.rating as host_rating,
    h.past_retreats_count,
    h.min_rate as host_min_rate,
    h.max_rate as host_max_rate,
    c.verified as cohost_verified,
    c.skills,
    c.hourly_rate as cohost_hourly_rate,
    c.min_rate as cohost_min_rate,
    c.max_rate as cohost_max_rate,
    c.rating as cohost_rating,
    c.availability as cohost_availability,
    c.past_collaborations_count,
    s.verified as staff_verified,
    s.service_type,
    s.day_rate as staff_day_rate,
    s.min_rate as staff_min_rate,
    s.max_rate as staff_max_rate,
    s.rating as staff_rating,
    s.experience_years,
    s.availability as staff_availability,
    s.portfolio_url,
    COALESCE(h.verified, false) OR COALESCE(c.verified, false) OR COALESCE(s.verified, false) as is_verified
  FROM public.profiles p
  LEFT JOIN public.hosts h ON h.user_id = p.id
  LEFT JOIN public.cohosts c ON c.user_id = p.id
  LEFT JOIN public.staff_profiles s ON s.user_id = p.id
  WHERE has_role(auth.uid(), 'admin'::app_role)  -- Only admins can access directory
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = p.id 
      AND ur.role IN ('host', 'cohost', 'staff')
    )
$$;