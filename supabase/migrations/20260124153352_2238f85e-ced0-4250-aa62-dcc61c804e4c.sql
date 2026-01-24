-- Update get_property_locations with proper access control matching retreats RLS
-- Allows visibility for: published retreats (anyone), own retreats (host), or team member retreats

CREATE OR REPLACE FUNCTION public.get_property_locations(property_ids uuid[])
RETURNS TABLE (id uuid, location text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.location
  FROM public.properties p
  INNER JOIN public.retreats r ON r.property_id = p.id
  WHERE p.id = ANY(property_ids)
    AND (
      r.status = 'published'
      OR r.host_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.retreat_team rt
        WHERE rt.retreat_id = r.id AND rt.user_id = auth.uid()
      )
    );
$$;