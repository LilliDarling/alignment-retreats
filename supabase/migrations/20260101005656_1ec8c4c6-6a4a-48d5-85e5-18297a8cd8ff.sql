-- Drop existing function first since return type is changing
DROP FUNCTION IF EXISTS public.get_directory_profiles();

-- Recreate with landowner/property data included
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
 RETURNS TABLE(
   id uuid, 
   name character varying, 
   profile_photo character varying, 
   bio text, 
   roles text[], 
   host_verified boolean, 
   expertise_areas text[], 
   host_rating numeric, 
   past_retreats_count integer, 
   host_min_rate numeric, 
   host_max_rate numeric, 
   cohost_verified boolean, 
   skills text[], 
   cohost_hourly_rate numeric, 
   cohost_min_rate numeric, 
   cohost_max_rate numeric, 
   cohost_rating numeric, 
   cohost_availability character varying, 
   past_collaborations_count integer, 
   staff_verified boolean, 
   service_type character varying, 
   staff_day_rate numeric, 
   staff_min_rate numeric, 
   staff_max_rate numeric, 
   staff_rating numeric, 
   experience_years integer, 
   staff_availability character varying, 
   portfolio_url character varying, 
   is_verified boolean,
   property_name character varying,
   property_location character varying,
   property_capacity integer,
   property_base_price numeric,
   property_type text,
   property_min_rate numeric,
   property_max_rate numeric
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(h.verified, false) OR COALESCE(c.verified, false) OR COALESCE(s.verified, false) as is_verified,
    prop.name as property_name,
    prop.location as property_location,
    prop.capacity as property_capacity,
    prop.base_price as property_base_price,
    prop.property_type::text as property_type,
    prop.min_rate as property_min_rate,
    prop.max_rate as property_max_rate
  FROM public.profiles p
  LEFT JOIN public.hosts h ON h.user_id = p.id
  LEFT JOIN public.cohosts c ON c.user_id = p.id
  LEFT JOIN public.staff_profiles s ON s.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT * FROM public.properties 
    WHERE owner_user_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) prop ON true
  WHERE has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = p.id 
      AND ur.role IN ('host', 'cohost', 'staff', 'landowner')
    )
$function$;