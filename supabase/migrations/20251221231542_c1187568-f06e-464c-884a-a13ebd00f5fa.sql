-- Step 1: Create a secure payments table that users cannot access directly
CREATE TABLE public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_id character varying,
  stripe_customer_id character varying,
  amount_paid numeric,
  payment_status payment_status DEFAULT 'pending'::payment_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

-- NO SELECT policies for regular users - only system/admin can access
-- Admin-only policy for viewing payment data
CREATE POLICY "Only admins can view payment data"
ON public.booking_payments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- System can insert via service role (no user insert policy)
-- Admin-only insert for manual corrections
CREATE POLICY "Only admins can insert payment data"
ON public.booking_payments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin-only update
CREATE POLICY "Only admins can update payment data"
ON public.booking_payments FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Step 2: Migrate existing payment data
INSERT INTO public.booking_payments (booking_id, stripe_payment_id, amount_paid, payment_status)
SELECT id, stripe_payment_id, amount_paid, payment_status
FROM public.bookings
WHERE stripe_payment_id IS NOT NULL OR amount_paid IS NOT NULL;

-- Step 3: Remove sensitive columns from bookings table
ALTER TABLE public.bookings DROP COLUMN IF EXISTS stripe_payment_id;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS amount_paid;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS payment_status;

-- Step 4: Create a secure function for users to check their own payment status (returns minimal info)
CREATE OR REPLACE FUNCTION public.get_booking_payment_status(booking_uuid uuid)
RETURNS TABLE(
  booking_id uuid,
  status text,
  is_paid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bp.booking_id,
    bp.payment_status::text as status,
    (bp.payment_status = 'completed') as is_paid
  FROM public.booking_payments bp
  INNER JOIN public.bookings b ON b.id = bp.booking_id
  WHERE bp.booking_id = booking_uuid
    AND (b.attendee_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM retreats r 
      WHERE r.id = b.retreat_id AND r.host_user_id = auth.uid()
    ))
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_booking_payments_updated_at
BEFORE UPDATE ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();