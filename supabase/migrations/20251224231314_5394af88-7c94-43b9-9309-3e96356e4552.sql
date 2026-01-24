-- Drop the SECURITY DEFINER view and recreate it with SECURITY INVOKER
DROP VIEW IF EXISTS public.properties_public;

CREATE VIEW public.properties_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  location,
  property_type,
  description,
  capacity,
  amenities,
  photos,
  property_features
FROM public.properties;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.properties_public TO authenticated;