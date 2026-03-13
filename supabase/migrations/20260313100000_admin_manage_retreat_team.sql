-- Allow admins to manage retreat_team rows (add/update/remove costs)
CREATE POLICY "Admins can manage retreat team"
  ON public.retreat_team FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
