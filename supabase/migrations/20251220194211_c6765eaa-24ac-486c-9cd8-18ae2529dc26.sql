-- Make mathew.vetten@gmail.com an admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('d1af398b-a299-4b58-bcf0-86765d62753e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;