-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;

-- Create policy for authenticated users to view properties (basic listing info)
CREATE POLICY "Authenticated users can view properties"
ON public.properties FOR SELECT
TO authenticated
USING (true);

-- Create policy for admins to view all properties (they already have access via authenticated policy, but this is explicit)
CREATE POLICY "Admins can view all properties"
ON public.properties FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view that excludes sensitive owner information
-- This can be used for unauthenticated browsing if needed in the future
CREATE OR REPLACE VIEW public.properties_public AS
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