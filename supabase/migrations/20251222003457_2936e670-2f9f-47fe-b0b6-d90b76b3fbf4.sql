-- Function to get escrow summary (GBV metrics)
CREATE OR REPLACE FUNCTION public.get_escrow_summary()
RETURNS TABLE(
  total_gbv numeric,
  held_in_escrow numeric,
  pending_release numeric,
  total_released numeric,
  active_escrows bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(SUM(total_amount), 0) as total_gbv,
    COALESCE(SUM(held_amount), 0) as held_in_escrow,
    COALESCE(SUM(CASE WHEN status = 'partial_released' THEN held_amount ELSE 0 END), 0) as pending_release,
    COALESCE(SUM(released_amount), 0) as total_released,
    COUNT(*) FILTER (WHERE status IN ('holding', 'partial_released')) as active_escrows
  FROM public.escrow_accounts
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;

-- Function to get host performance with conversion rates
CREATE OR REPLACE FUNCTION public.get_host_performance()
RETURNS TABLE(
  host_user_id uuid,
  host_name varchar,
  total_retreats bigint,
  total_bookings bigint,
  total_retreat_views bigint,
  conversion_rate numeric,
  total_revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    h.user_id as host_user_id,
    p.name as host_name,
    COUNT(DISTINCT r.id) as total_retreats,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE((
      SELECT COUNT(*) 
      FROM public.analytics_events ae 
      WHERE ae.event_name = 'page_view' 
        AND ae.page_path LIKE '/retreat/%'
        AND ae.metadata->>'retreat_host_id' = h.user_id::text
    ), 0)::bigint as total_retreat_views,
    CASE 
      WHEN COALESCE((
        SELECT COUNT(*) 
        FROM public.analytics_events ae 
        WHERE ae.event_name = 'page_view' 
          AND ae.page_path LIKE '/retreat/%'
          AND ae.metadata->>'retreat_host_id' = h.user_id::text
      ), 0) > 0 
      THEN ROUND((COUNT(DISTINCT b.id)::numeric / NULLIF((
        SELECT COUNT(*) 
        FROM public.analytics_events ae 
        WHERE ae.event_name = 'page_view' 
          AND ae.page_path LIKE '/retreat/%'
          AND ae.metadata->>'retreat_host_id' = h.user_id::text
      ), 0)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    COALESCE(SUM(bp.amount_paid), 0) as total_revenue
  FROM public.hosts h
  JOIN public.profiles p ON p.id = h.user_id
  LEFT JOIN public.retreats r ON r.host_user_id = h.user_id
  LEFT JOIN public.bookings b ON b.retreat_id = r.id
  LEFT JOIN public.booking_payments bp ON bp.booking_id = b.id AND bp.payment_status = 'completed'
  WHERE has_role(auth.uid(), 'admin'::app_role)
  GROUP BY h.user_id, p.name
  ORDER BY COUNT(DISTINCT b.id) DESC
$$;

-- Function to get at-risk retreats (Fire Alarm)
CREATE OR REPLACE FUNCTION public.get_at_risk_retreats()
RETURNS TABLE(
  retreat_id uuid,
  title varchar,
  host_user_id uuid,
  host_name varchar,
  start_date date,
  days_until_start integer,
  max_attendees integer,
  current_bookings bigint,
  fill_rate numeric,
  revenue_at_risk numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id as retreat_id,
    r.title,
    r.host_user_id,
    p.name as host_name,
    r.start_date,
    (r.start_date - CURRENT_DATE)::integer as days_until_start,
    r.max_attendees,
    COUNT(b.id) as current_bookings,
    CASE 
      WHEN r.max_attendees > 0 
      THEN ROUND((COUNT(b.id)::numeric / r.max_attendees::numeric) * 100, 1)
      ELSE 0
    END as fill_rate,
    COALESCE(r.price_per_person * (r.max_attendees - COUNT(b.id)), 0) as revenue_at_risk
  FROM public.retreats r
  JOIN public.profiles p ON p.id = r.host_user_id
  LEFT JOIN public.bookings b ON b.retreat_id = r.id
  WHERE r.status = 'published'
    AND r.start_date > CURRENT_DATE
    AND r.start_date <= CURRENT_DATE + INTERVAL '30 days'
    AND has_role(auth.uid(), 'admin'::app_role)
  GROUP BY r.id, r.title, r.host_user_id, p.name, r.start_date, r.max_attendees, r.price_per_person
  HAVING CASE 
    WHEN r.max_attendees > 0 
    THEN (COUNT(b.id)::numeric / r.max_attendees::numeric) < 0.5
    ELSE false
  END
  ORDER BY r.start_date ASC
$$;