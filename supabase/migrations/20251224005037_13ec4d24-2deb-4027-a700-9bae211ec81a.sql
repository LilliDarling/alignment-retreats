-- Add 'pending_review' to retreat_status enum
ALTER TYPE retreat_status ADD VALUE IF NOT EXISTS 'pending_review';

-- Add submission-specific fields to retreats table
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS what_you_offer TEXT;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS what_you_want TEXT;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS looking_for JSONB DEFAULT '{}';
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS sample_itinerary TEXT;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS preferred_dates_flexible BOOLEAN DEFAULT false;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert notifications (will be done via edge function with service role)
CREATE POLICY "Service can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);