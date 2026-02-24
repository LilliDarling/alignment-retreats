-- Allow admins to update any property (e.g. approve/reject venue submissions)
CREATE POLICY "Admins can update any property"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
