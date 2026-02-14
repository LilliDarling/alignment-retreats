-- Allow users with the host role to insert their own host profile
-- This handles cases where roles are added after signup (e.g., via admin)
-- and the handle_new_user trigger didn't create the role-specific row
CREATE POLICY "Hosts can insert own profile"
  ON public.hosts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'host'));

CREATE POLICY "Cohosts can insert own profile"
  ON public.cohosts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'cohost'));

CREATE POLICY "Staff can insert own profile"
  ON public.staff_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'staff'));
