-- Drop and recreate get_escrow_summary to include platform fees
DROP FUNCTION IF EXISTS public.get_escrow_summary();

CREATE FUNCTION public.get_escrow_summary()
RETURNS TABLE(
  total_gbv numeric, 
  held_in_escrow numeric, 
  pending_release numeric, 
  total_released numeric, 
  active_escrows bigint,
  platform_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(total_amount), 0) as total_gbv,
    COALESCE(SUM(held_amount), 0) as held_in_escrow,
    COALESCE(SUM(CASE WHEN status = 'partial_released' THEN held_amount ELSE 0 END), 0) as pending_release,
    COALESCE(SUM(released_amount), 0) as total_released,
    COUNT(*) FILTER (WHERE status IN ('holding', 'partial_released')) as active_escrows,
    COALESCE(SUM(platform_fee), 0) as platform_revenue
  FROM public.escrow_accounts
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;