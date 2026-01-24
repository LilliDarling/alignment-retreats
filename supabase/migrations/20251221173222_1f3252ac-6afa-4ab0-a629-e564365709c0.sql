-- Allow users to assign themselves NON-admin roles (host/cohost/landowner/staff/attendee)
-- This enables the signup flow to persist selected roles into public.user_roles.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Users can choose own non-admin roles'
  ) THEN
    DROP POLICY "Users can choose own non-admin roles" ON public.user_roles;
  END IF;
END $$;

CREATE POLICY "Users can choose own non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role <> 'admin'::public.app_role
);
