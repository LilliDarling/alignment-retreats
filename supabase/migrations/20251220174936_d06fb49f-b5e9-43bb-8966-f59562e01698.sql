-- Update handle_new_user function to support multiple roles
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
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
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