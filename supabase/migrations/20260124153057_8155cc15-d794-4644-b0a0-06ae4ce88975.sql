-- Fix get_property_locations to only return locations for properties linked to published retreats
-- Removes row_security = off and adds join filter for published retreats

CREATE OR REPLACE FUNCTION public.get_property_locations(property_ids uuid[])
RETURNS TABLE (
  id uuid,
  location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.location
  FROM public.properties p
  INNER JOIN public.retreats r ON r.property_id = p.id
  WHERE p.id = ANY(property_ids)
    AND r.status = 'published';
$$;

-- Ensure only authenticated users can call this function
REVOKE EXECUTE ON FUNCTION public.get_property_locations(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_property_locations(uuid[]) TO authenticated;