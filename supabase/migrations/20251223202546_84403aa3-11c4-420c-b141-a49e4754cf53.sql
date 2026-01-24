-- Create function to get average market rates from directory profiles
CREATE OR REPLACE FUNCTION public.get_market_rate_averages()
RETURNS TABLE(
  role_type text,
  avg_min_rate numeric,
  avg_max_rate numeric,
  count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'host'::text as role_type,
    ROUND(AVG(min_rate), 2) as avg_min_rate,
    ROUND(AVG(max_rate), 2) as avg_max_rate,
    COUNT(*) as count
  FROM public.hosts
  WHERE verified = true AND min_rate IS NOT NULL AND max_rate IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'cohost'::text as role_type,
    ROUND(AVG(min_rate), 2) as avg_min_rate,
    ROUND(AVG(max_rate), 2) as avg_max_rate,
    COUNT(*) as count
  FROM public.cohosts
  WHERE verified = true AND min_rate IS NOT NULL AND max_rate IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'venue'::text as role_type,
    ROUND(AVG(min_rate), 2) as avg_min_rate,
    ROUND(AVG(max_rate), 2) as avg_max_rate,
    COUNT(*) as count
  FROM public.staff_profiles
  WHERE verified = true AND service_type = 'venue' AND min_rate IS NOT NULL AND max_rate IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'chef'::text as role_type,
    ROUND(AVG(min_rate), 2) as avg_min_rate,
    ROUND(AVG(max_rate), 2) as avg_max_rate,
    COUNT(*) as count
  FROM public.staff_profiles
  WHERE verified = true AND service_type = 'chef' AND min_rate IS NOT NULL AND max_rate IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'staff'::text as role_type,
    ROUND(AVG(day_rate), 2) as avg_min_rate,
    ROUND(AVG(day_rate), 2) as avg_max_rate,
    COUNT(*) as count
  FROM public.staff_profiles
  WHERE verified = true AND day_rate IS NOT NULL
$$;