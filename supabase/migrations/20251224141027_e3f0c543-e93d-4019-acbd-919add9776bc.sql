-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view published retreats" ON public.retreats;

-- Create updated policy with admin access
CREATE POLICY "Anyone can view published retreats or admins see all" 
ON public.retreats 
FOR SELECT 
USING (
  (status = 'published'::retreat_status) 
  OR (auth.uid() = host_user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);