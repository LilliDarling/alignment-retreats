-- Public helper to fetch property locations without exposing sensitive property contact fields
-- Uses SECURITY DEFINER + row_security=off to bypass RLS safely for this limited projection

CREATE OR REPLACE FUNCTION public.get_property_locations(property_ids uuid[])
RETURNS TABLE (
  id uuid,
  location text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT p.id, p.location
  FROM public.properties p
  WHERE p.id = ANY(property_ids);
$$;

REVOKE ALL ON FUNCTION public.get_property_locations(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_property_locations(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_property_locations(uuid[]) TO authenticated;