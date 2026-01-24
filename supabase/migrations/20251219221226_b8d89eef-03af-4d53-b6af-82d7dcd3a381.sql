-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('host', 'cohost', 'landowner', 'staff', 'attendee');

-- Create enum for property types
CREATE TYPE public.property_type AS ENUM ('land', 'retreat_center', 'venue');

-- Create enum for retreat status
CREATE TYPE public.retreat_status AS ENUM ('draft', 'published', 'full', 'completed', 'cancelled');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'refunded');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  profile_photo VARCHAR,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (secure role storage)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create hosts table
CREATE TABLE public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  expertise_areas TEXT[] DEFAULT '{}',
  past_retreats_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cohosts table
CREATE TABLE public.cohosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  skills TEXT[] DEFAULT '{}',
  availability VARCHAR,
  hourly_rate DECIMAL(10,2),
  past_collaborations_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR NOT NULL,
  location VARCHAR,
  property_type property_type NOT NULL,
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  base_price DECIMAL(10,2),
  photos TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_profiles table
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_type VARCHAR,
  experience_years INTEGER DEFAULT 0,
  portfolio_url VARCHAR,
  day_rate DECIMAL(10,2),
  availability VARCHAR,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retreats table
CREATE TABLE public.retreats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  retreat_type VARCHAR,
  start_date DATE,
  end_date DATE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  max_attendees INTEGER,
  price_per_person DECIMAL(10,2),
  status retreat_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE NOT NULL,
  attendee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  amount_paid DECIMAL(10,2),
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_payment_id VARCHAR
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retreats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Insert user role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::app_role, 'attendee')
  );
  
  -- Create role-specific profile based on user type
  CASE (NEW.raw_user_meta_data->>'user_type')
    WHEN 'host' THEN
      INSERT INTO public.hosts (user_id) VALUES (NEW.id);
    WHEN 'cohost' THEN
      INSERT INTO public.cohosts (user_id) VALUES (NEW.id);
    WHEN 'landowner' THEN
      -- No additional table needed, they create properties
      NULL;
    WHEN 'staff' THEN
      INSERT INTO public.staff_profiles (user_id) VALUES (NEW.id);
    ELSE
      -- attendee - no additional profile needed
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (users cannot modify their own roles)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for hosts
CREATE POLICY "Anyone can view host profiles"
  ON public.hosts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hosts can update own profile"
  ON public.hosts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for cohosts
CREATE POLICY "Anyone can view cohost profiles"
  ON public.cohosts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cohosts can update own profile"
  ON public.cohosts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for properties
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Landowners can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- RLS Policies for staff_profiles
CREATE POLICY "Anyone can view staff profiles"
  ON public.staff_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can update own profile"
  ON public.staff_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for retreats
CREATE POLICY "Anyone can view published retreats"
  ON public.retreats FOR SELECT
  USING (status = 'published' OR auth.uid() = host_user_id);

CREATE POLICY "Hosts can insert retreats"
  ON public.retreats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update own retreats"
  ON public.retreats FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete own retreats"
  ON public.retreats FOR DELETE
  TO authenticated
  USING (auth.uid() = host_user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = attendee_user_id OR 
         auth.uid() = (SELECT host_user_id FROM public.retreats WHERE id = retreat_id));

CREATE POLICY "Attendees can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = attendee_user_id);

CREATE POLICY "Attendees can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = attendee_user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for property photos
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Users can upload property photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own property photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own property photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);