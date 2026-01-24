-- Create an audit log table for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_count integer,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via security definer function)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Update the admin profiles function to log access and mask emails
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  name character varying,
  email character varying,
  created_at timestamp with time zone,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Return profiles with masked emails (show first 2 chars + domain)
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    CASE 
      WHEN length(split_part(p.email, '@', 1)) > 2 
      THEN (left(split_part(p.email, '@', 1), 2) || '***@' || split_part(p.email, '@', 2))::character varying
      ELSE ('***@' || split_part(p.email, '@', 2))::character varying
    END as email,
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
  ORDER BY p.created_at DESC;
END;
$$;

-- Create a separate function for full email access with additional logging
CREATE OR REPLACE FUNCTION public.get_profile_email_admin(profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get the email
  SELECT email INTO user_email FROM public.profiles WHERE id = profile_id;

  -- Log the specific email access
  INSERT INTO public.admin_audit_log (admin_user_id, action, resource_type, resource_count)
  VALUES (auth.uid(), 'view_user_email', 'profiles', 1);

  RETURN user_email;
END;
$$;