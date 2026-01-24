-- Create retreat_wishes table for attendee dream retreat requests
CREATE TABLE public.retreat_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Experience preferences
  retreat_types TEXT[] DEFAULT '{}',
  desired_experiences TEXT[] DEFAULT '{}',
  description TEXT,
  
  -- Location & Dates
  preferred_timeframe TEXT,
  preferred_dates_start DATE,
  preferred_dates_end DATE,
  dates_flexible BOOLEAN DEFAULT true,
  location_preferences TEXT[] DEFAULT '{}',
  international_ok BOOLEAN DEFAULT false,
  
  -- Financial data
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_flexibility VARCHAR DEFAULT 'moderate',
  group_size INTEGER DEFAULT 1,
  bringing_others BOOLEAN DEFAULT false,
  priority VARCHAR DEFAULT 'balanced',
  
  -- Status & Matching
  status VARCHAR DEFAULT 'active',
  matched_retreat_id UUID REFERENCES public.retreats(id),
  matched_at TIMESTAMP WITH TIME ZONE,
  email_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.retreat_wishes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retreat_wishes
CREATE POLICY "Users can insert own wishes" ON public.retreat_wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wishes" ON public.retreat_wishes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wishes" ON public.retreat_wishes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishes" ON public.retreat_wishes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wishes" ON public.retreat_wishes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add financial columns to retreats table
ALTER TABLE public.retreats 
  ADD COLUMN IF NOT EXISTS venue_budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS venue_budget_max NUMERIC,
  ADD COLUMN IF NOT EXISTS team_budget_total NUMERIC,
  ADD COLUMN IF NOT EXISTS target_attendees_min INTEGER,
  ADD COLUMN IF NOT EXISTS target_attendees_max INTEGER;

-- Add rate range columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS min_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS max_rate NUMERIC;

-- Create trigger for updated_at on retreat_wishes
CREATE TRIGGER update_retreat_wishes_updated_at
  BEFORE UPDATE ON public.retreat_wishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();