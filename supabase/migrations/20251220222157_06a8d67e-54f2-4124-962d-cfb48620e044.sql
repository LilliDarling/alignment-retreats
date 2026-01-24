-- Create a security definer function to check if user is host of the retreat
CREATE OR REPLACE FUNCTION public.is_retreat_host(_user_id uuid, _retreat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.retreats
    WHERE id = _retreat_id
      AND host_user_id = _user_id
  )
$$;

-- Add policy allowing hosts to view bookings for their own retreats
CREATE POLICY "Hosts can view bookings for their retreats" 
ON public.bookings 
FOR SELECT 
USING (public.is_retreat_host(auth.uid(), retreat_id));