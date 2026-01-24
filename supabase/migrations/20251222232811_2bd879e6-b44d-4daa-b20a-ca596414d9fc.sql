-- Update the get_all_profiles_admin function to return full email addresses
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
 RETURNS TABLE(id uuid, name character varying, email character varying, created_at timestamp with time zone, roles text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_count integer;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get count for audit log
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  -- Log the admin access
  INSERT INTO public.admin_audit_log (admin_user_id, action, resource_type, resource_count)
  VALUES (auth.uid(), 'view_all_profiles', 'profiles', profile_count);

  -- Return profiles with FULL emails from auth.users (admin only)
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    u.email::character varying as email,
    p.created_at,
    COALESCE(
      ARRAY(
        SELECT ur.role::text 
        FROM public.user_roles ur 
        WHERE ur.user_id = p.id
      ),
      '{}'::text[]
    ) as roles
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$function$;