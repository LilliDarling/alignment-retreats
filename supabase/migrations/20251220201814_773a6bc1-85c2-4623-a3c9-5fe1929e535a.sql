-- Fix Critical Security Issue #1: Remove permissive host policy that exposes Stripe payment IDs
-- Hosts will use the secure get_host_retreat_bookings() function instead
DROP POLICY IF EXISTS "Hosts can view booking metadata for own retreats" ON public.bookings;

-- Fix Critical Security Issue #2: Explicitly deny anonymous access to profiles
-- This prevents any possibility of public email exposure
CREATE POLICY "Anonymous users cannot view profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);