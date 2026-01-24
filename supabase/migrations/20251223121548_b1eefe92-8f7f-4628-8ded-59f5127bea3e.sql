-- Create a secure view for retreats that masks host_user_id for unauthenticated users
CREATE OR REPLACE VIEW public.retreats_public AS
SELECT 
  id,
  title,
  description,
  retreat_type,
  start_date,
  end_date,
  max_attendees,
  price_per_person,
  property_id,
  status,
  created_at,
  -- Only expose host_user_id to authenticated users
  CASE 
    WHEN auth.uid() IS NOT NULL THEN host_user_id
    ELSE NULL
  END as host_user_id
FROM public.retreats
WHERE status = 'published' OR host_user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.retreats_public TO anon, authenticated;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.retreats_public IS 'Secure view that masks host_user_id for unauthenticated users to prevent identity scraping';