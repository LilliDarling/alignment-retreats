-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- Security definer functions bypass RLS, so they can still insert
-- No public insert policy needed - this prevents any direct client-side inserts