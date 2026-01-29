-- Make mathew.vetten@gmail.com an admin (only if the user exists)
INSERT INTO public.user_roles (user_id, role)
SELECT 'd1af398b-a299-4b58-bcf0-86765d62753e', 'admin'
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'd1af398b-a299-4b58-bcf0-86765d62753e'
)
ON CONFLICT (user_id, role) DO NOTHING;