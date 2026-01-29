-- Grant admin role to initial admin user by email lookup
-- This avoids hardcoding UUIDs which can trigger false-positive security warnings
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'mathew.vetten@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;