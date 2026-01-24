-- Fix Critical Security Issue: Remove email from profiles table
-- Emails are already stored securely in auth.users

-- Step 1: Update get_all_profiles_admin to fetch email from auth.users instead
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

  -- Return profiles with masked emails from auth.users (show first 2 chars + domain)
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    CASE 
      WHEN length(split_part(u.email, '@', 1)) > 2 
      THEN (left(split_part(u.email, '@', 1), 2) || '***@' || split_part(u.email, '@', 2))::character varying
      ELSE ('***@' || split_part(u.email, '@', 2))::character varying
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
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$function$;

-- Step 2: Update get_profile_email_admin to fetch from auth.users
CREATE OR REPLACE FUNCTION public.get_profile_email_admin(profile_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get the email from auth.users instead of profiles
  SELECT email INTO user_email FROM auth.users WHERE id = profile_id;

  -- Log the specific email access
  INSERT INTO public.admin_audit_log (admin_user_id, action, resource_type, resource_count)
  VALUES (auth.uid(), 'view_user_email', 'profiles', 1);

  RETURN user_email;
END;
$function$;

-- Step 3: Update handle_new_user to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_types_array text[];
  user_type text;
BEGIN
  -- Insert into profiles (without email - it stays in auth.users)
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Get user_types as array (supports both single value and array)
  IF NEW.raw_user_meta_data ? 'user_types' THEN
    -- Parse JSON array to text array
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'user_types')
    ) INTO user_types_array;
  ELSIF NEW.raw_user_meta_data ? 'user_type' THEN
    -- Fallback for single user_type (backward compatibility)
    user_types_array := ARRAY[NEW.raw_user_meta_data->>'user_type'];
  ELSE
    -- Default to attendee
    user_types_array := ARRAY['attendee'];
  END IF;
  
  -- Insert each role into user_roles and create role-specific profiles
  FOREACH user_type IN ARRAY user_types_array
  LOOP
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_type::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create role-specific profile based on user type
    CASE user_type
      WHEN 'host' THEN
        INSERT INTO public.hosts (user_id) VALUES (NEW.id)
        ON CONFLICT DO NOTHING;
      WHEN 'cohost' THEN
        INSERT INTO public.cohosts (user_id) VALUES (NEW.id)
        ON CONFLICT DO NOTHING;
      WHEN 'landowner' THEN
        -- No additional table needed, they create properties
        NULL;
      WHEN 'staff' THEN
        INSERT INTO public.staff_profiles (user_id) VALUES (NEW.id)
        ON CONFLICT DO NOTHING;
      ELSE
        -- attendee - no additional profile needed
        NULL;
    END CASE;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Remove the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;