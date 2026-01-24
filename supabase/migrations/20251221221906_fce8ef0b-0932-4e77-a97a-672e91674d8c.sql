-- Drop the existing policy that checks server admin
DROP POLICY IF EXISTS "Admins can create channels" ON public.chat_channels;

-- Create new policy that checks for app-level admin role
CREATE POLICY "App admins can create channels" 
ON public.chat_channels 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));