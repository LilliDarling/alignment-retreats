-- Add new columns to cohosts table for improved onboarding
ALTER TABLE public.cohosts 
ADD COLUMN IF NOT EXISTS daily_rate numeric,
ADD COLUMN IF NOT EXISTS available_from date,
ADD COLUMN IF NOT EXISTS available_to date,
ADD COLUMN IF NOT EXISTS preferred_climates text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_regions text;

-- Update the handle_new_user function to handle new cohost fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_types_array text[];
  user_type text;
  onboarding jsonb;
  host_data jsonb;
  cohost_data jsonb;
  staff_data jsonb;
  landowner_data jsonb;
  completed_onboarding jsonb := '{}'::jsonb;
BEGIN
  -- Insert into profiles (without email - it stays in auth.users)
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Get user_types as array (supports both single value and array)
  IF NEW.raw_user_meta_data ? 'user_types' THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'user_types')
    ) INTO user_types_array;
  ELSIF NEW.raw_user_meta_data ? 'user_type' THEN
    user_types_array := ARRAY[NEW.raw_user_meta_data->>'user_type'];
  ELSE
    user_types_array := ARRAY['attendee'];
  END IF;
  
  -- Get onboarding data if present
  onboarding := COALESCE(NEW.raw_user_meta_data->'onboarding', '{}'::jsonb);
  host_data := onboarding->'host';
  cohost_data := onboarding->'cohost';
  staff_data := onboarding->'staff';
  landowner_data := onboarding->'landowner';
  
  -- Insert each role into user_roles and create role-specific profiles
  FOREACH user_type IN ARRAY user_types_array
  LOOP
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_type::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create role-specific profile based on user type with onboarding data
    CASE user_type
      WHEN 'host' THEN
        IF host_data IS NOT NULL AND host_data != 'null'::jsonb THEN
          INSERT INTO public.hosts (user_id, expertise_areas, min_rate, max_rate)
          VALUES (
            NEW.id,
            ARRAY(SELECT jsonb_array_elements_text(host_data->'expertiseAreas')),
            (host_data->>'minRate')::numeric,
            (host_data->>'maxRate')::numeric
          )
          ON CONFLICT DO NOTHING;
          completed_onboarding := completed_onboarding || '{"host": true}'::jsonb;
        ELSE
          INSERT INTO public.hosts (user_id) VALUES (NEW.id)
          ON CONFLICT DO NOTHING;
        END IF;
        
      WHEN 'cohost' THEN
        IF cohost_data IS NOT NULL AND cohost_data != 'null'::jsonb THEN
          INSERT INTO public.cohosts (
            user_id, 
            skills, 
            daily_rate, 
            min_rate, 
            max_rate,
            available_from,
            available_to,
            preferred_climates,
            preferred_regions
          )
          VALUES (
            NEW.id,
            ARRAY(SELECT jsonb_array_elements_text(cohost_data->'skills')),
            (cohost_data->>'dailyRate')::numeric,
            (cohost_data->>'minRate')::numeric,
            (cohost_data->>'maxRate')::numeric,
            (cohost_data->>'availableFrom')::date,
            (cohost_data->>'availableTo')::date,
            ARRAY(SELECT jsonb_array_elements_text(cohost_data->'preferredClimates')),
            cohost_data->>'preferredRegions'
          )
          ON CONFLICT DO NOTHING;
          completed_onboarding := completed_onboarding || '{"cohost": true}'::jsonb;
        ELSE
          INSERT INTO public.cohosts (user_id) VALUES (NEW.id)
          ON CONFLICT DO NOTHING;
        END IF;
        
      WHEN 'landowner' THEN
        IF landowner_data IS NOT NULL AND landowner_data != 'null'::jsonb THEN
          INSERT INTO public.properties (
            owner_user_id,
            name,
            property_type,
            capacity,
            location,
            base_price,
            min_rate,
            max_rate,
            description,
            amenities,
            contact_name,
            contact_email,
            instagram_handle,
            tiktok_handle,
            content_status,
            existing_content_link,
            content_description,
            interested_in_residency,
            residency_available_dates,
            property_features
          )
          VALUES (
            NEW.id,
            landowner_data->>'propertyName',
            (landowner_data->>'propertyType')::property_type,
            (landowner_data->>'capacity')::integer,
            landowner_data->>'location',
            (landowner_data->>'basePrice')::numeric,
            (landowner_data->>'minRate')::numeric,
            (landowner_data->>'maxRate')::numeric,
            landowner_data->>'description',
            ARRAY(SELECT jsonb_array_elements_text(landowner_data->'amenities')),
            landowner_data->>'contactName',
            landowner_data->>'contactEmail',
            landowner_data->>'instagramHandle',
            landowner_data->>'tiktokHandle',
            landowner_data->>'contentStatus',
            landowner_data->>'existingContentLink',
            landowner_data->>'contentDescription',
            COALESCE((landowner_data->>'interestedInResidency')::boolean, false),
            landowner_data->>'residencyAvailableDates',
            ARRAY(SELECT jsonb_array_elements_text(landowner_data->'propertyFeatures'))
          );
          completed_onboarding := completed_onboarding || '{"landowner": true}'::jsonb;
        END IF;
        
      WHEN 'staff' THEN
        IF staff_data IS NOT NULL AND staff_data != 'null'::jsonb THEN
          INSERT INTO public.staff_profiles (user_id, service_type, experience_years, day_rate, availability, portfolio_url)
          VALUES (
            NEW.id,
            staff_data->>'serviceType',
            (staff_data->>'experienceYears')::integer,
            (staff_data->>'dayRate')::numeric,
            staff_data->>'availability',
            staff_data->>'portfolioUrl'
          )
          ON CONFLICT DO NOTHING;
          completed_onboarding := completed_onboarding || '{"staff": true}'::jsonb;
        ELSE
          INSERT INTO public.staff_profiles (user_id) VALUES (NEW.id)
          ON CONFLICT DO NOTHING;
        END IF;
        
      ELSE
        -- attendee - no additional profile needed
        NULL;
    END CASE;
  END LOOP;
  
  -- Update profiles with completed onboarding status
  IF completed_onboarding != '{}'::jsonb THEN
    UPDATE public.profiles 
    SET onboarding_completed = completed_onboarding
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;