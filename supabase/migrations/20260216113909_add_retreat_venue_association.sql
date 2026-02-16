-- Add property_id to retreats table for venue association
ALTER TABLE public.retreats
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_retreats_property_id ON retreats(property_id);

-- Add comment
COMMENT ON COLUMN retreats.property_id IS 'Optional reference to the venue/property where this retreat is held';

-- Add custom_venue_name for when retreat uses unlisted venue
ALTER TABLE public.retreats
  ADD COLUMN IF NOT EXISTS custom_venue_name TEXT;

COMMENT ON COLUMN retreats.custom_venue_name IS 'Name/location of venue when not using a listed property';
