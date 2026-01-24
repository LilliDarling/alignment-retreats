-- Fix the security definer view issue by using SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.analytics_daily_stats;

-- Create a function instead for admin-only access
CREATE OR REPLACE FUNCTION public.get_analytics_stats(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date date,
  event_name text,
  event_category text,
  event_count bigint,
  unique_sessions bigint,
  unique_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(created_at) as date,
    event_name,
    event_category,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
  FROM public.analytics_events
  WHERE created_at >= start_date 
    AND created_at < end_date + INTERVAL '1 day'
    AND public.has_role(auth.uid(), 'admin')
  GROUP BY DATE(created_at), event_name, event_category
  ORDER BY date DESC, event_count DESC
$$;