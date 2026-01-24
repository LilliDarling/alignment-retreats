-- Create enums for payment system
CREATE TYPE public.payout_status AS ENUM ('pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE public.escrow_status AS ENUM ('holding', 'partial_released', 'fully_released', 'refunded', 'disputed');
CREATE TYPE public.team_member_role AS ENUM ('host', 'cohost', 'venue', 'chef', 'staff', 'other');
CREATE TYPE public.stripe_account_status AS ENUM ('pending', 'onboarding', 'active', 'restricted', 'disabled');

-- Stripe Connected Accounts - tracks each user's Stripe account for payouts
CREATE TABLE public.stripe_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR NOT NULL,
  account_status stripe_account_status NOT NULL DEFAULT 'pending',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  business_type VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(stripe_account_id)
);

-- Retreat Team - tracks all parties involved in a retreat and their fees
CREATE TABLE public.retreat_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id UUID NOT NULL REFERENCES public.retreats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_member_role NOT NULL,
  fee_type VARCHAR NOT NULL CHECK (fee_type IN ('flat', 'per_person', 'per_night', 'per_person_per_night', 'percentage')),
  fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
  description TEXT,
  agreed BOOLEAN NOT NULL DEFAULT false,
  agreed_at TIMESTAMPTZ,
  stripe_account_id VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(retreat_id, user_id, role)
);

-- Escrow Accounts - holds funds for each booking
CREATE TABLE public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  held_amount NUMERIC NOT NULL DEFAULT 0 CHECK (held_amount >= 0),
  released_amount NUMERIC NOT NULL DEFAULT 0 CHECK (released_amount >= 0),
  refunded_amount NUMERIC NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  status escrow_status NOT NULL DEFAULT 'holding',
  deposit_released_at TIMESTAMPTZ,
  final_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Scheduled Payouts - tracks individual payouts to team members
CREATE TABLE public.scheduled_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES public.escrow_accounts(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retreat_team_id UUID REFERENCES public.retreat_team(id) ON DELETE SET NULL,
  stripe_transfer_id VARCHAR,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payout_type VARCHAR NOT NULL CHECK (payout_type IN ('deposit', 'final')),
  scheduled_date DATE NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add escrow_id to booking_payments for linking
ALTER TABLE public.booking_payments 
ADD COLUMN escrow_id UUID REFERENCES public.escrow_accounts(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.stripe_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retreat_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_connected_accounts
CREATE POLICY "Users can view own Stripe account"
  ON public.stripe_connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Stripe account"
  ON public.stripe_connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Stripe account"
  ON public.stripe_connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for retreat_team
CREATE POLICY "Host can manage retreat team"
  ON public.retreat_team FOR ALL
  USING (public.is_retreat_host(auth.uid(), retreat_id));

CREATE POLICY "Team members can view their assignments"
  ON public.retreat_team FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can update agreement status"
  ON public.retreat_team FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for escrow_accounts (admin and involved parties only)
CREATE POLICY "Admins can manage escrow"
  ON public.escrow_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Booking parties can view escrow"
  ON public.escrow_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = escrow_accounts.booking_id
      AND (b.attendee_user_id = auth.uid() OR public.is_retreat_host(auth.uid(), b.retreat_id))
    )
  );

-- RLS Policies for scheduled_payouts
CREATE POLICY "Admins can manage payouts"
  ON public.scheduled_payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recipients can view own payouts"
  ON public.scheduled_payouts FOR SELECT
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Hosts can view retreat payouts"
  ON public.scheduled_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow_accounts e
      JOIN public.bookings b ON b.id = e.booking_id
      WHERE e.id = scheduled_payouts.escrow_id
      AND public.is_retreat_host(auth.uid(), b.retreat_id)
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_stripe_connected_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retreat_team_updated_at
  BEFORE UPDATE ON public.retreat_team
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_accounts_updated_at
  BEFORE UPDATE ON public.escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_payouts_updated_at
  BEFORE UPDATE ON public.scheduled_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate total team fees for a retreat
CREATE OR REPLACE FUNCTION public.calculate_retreat_team_fees(
  _retreat_id UUID,
  _num_attendees INTEGER,
  _num_nights INTEGER
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE fee_type
      WHEN 'flat' THEN fee_amount
      WHEN 'per_person' THEN fee_amount * _num_attendees
      WHEN 'per_night' THEN fee_amount * _num_nights
      WHEN 'per_person_per_night' THEN fee_amount * _num_attendees * _num_nights
      WHEN 'percentage' THEN 0  -- Calculated separately on total
      ELSE 0
    END
  ), 0)
  FROM public.retreat_team
  WHERE retreat_id = _retreat_id AND agreed = true
$$;

-- Function to get payout breakdown for a booking
CREATE OR REPLACE FUNCTION public.get_payout_breakdown(
  _booking_id UUID
)
RETURNS TABLE(
  recipient_user_id UUID,
  recipient_name VARCHAR,
  role team_member_role,
  amount NUMERIC,
  deposit_amount NUMERIC,
  final_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rt.user_id as recipient_user_id,
    p.name as recipient_name,
    rt.role,
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date)
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date)
      ELSE 0
    END as amount,
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as deposit_amount,
    CASE rt.fee_type
      WHEN 'flat' THEN rt.fee_amount * 0.5
      WHEN 'per_person' THEN rt.fee_amount * r.max_attendees * 0.5
      WHEN 'per_night' THEN rt.fee_amount * (r.end_date - r.start_date) * 0.5
      WHEN 'per_person_per_night' THEN rt.fee_amount * r.max_attendees * (r.end_date - r.start_date) * 0.5
      ELSE 0
    END as final_amount
  FROM public.bookings b
  JOIN public.retreats r ON r.id = b.retreat_id
  JOIN public.retreat_team rt ON rt.retreat_id = r.id AND rt.agreed = true
  JOIN public.profiles p ON p.id = rt.user_id
  WHERE b.id = _booking_id
$$;