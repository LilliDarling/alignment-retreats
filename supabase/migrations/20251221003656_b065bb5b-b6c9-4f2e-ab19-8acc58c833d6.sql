-- Create analytics_events table for tracking user actions
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  event_category text NOT NULL DEFAULT 'general',
  user_id uuid,
  session_id text NOT NULL,
  page_url text,
  page_path text,
  referrer text,
  metadata jsonb DEFAULT '{}',
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert events
CREATE POLICY "Anyone can track events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics"
ON public.analytics_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create a view for daily aggregated stats (easier to query)
CREATE OR REPLACE VIEW public.analytics_daily_stats AS
SELECT 
  DATE(created_at) as date,
  event_name,
  event_category,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
FROM public.analytics_events
GROUP BY DATE(created_at), event_name, event_category
ORDER BY date DESC, event_count DESC;