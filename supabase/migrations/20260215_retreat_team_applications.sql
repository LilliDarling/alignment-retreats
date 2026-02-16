-- Allow authenticated users to apply to retreat teams (with agreed = false)
CREATE POLICY "Users can apply to retreat teams"
ON public.retreat_team FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND agreed = false);

-- Allow users to withdraw their own pending applications
CREATE POLICY "Users can withdraw own pending applications"
ON public.retreat_team FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND agreed = false);
