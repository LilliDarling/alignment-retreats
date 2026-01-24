-- Lock down waitlist SELECT to real admins only
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;

CREATE POLICY "Admins can view waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));