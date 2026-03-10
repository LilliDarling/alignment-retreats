-- Add ticket_price (calculated from all costs) and expected_attendees to retreats
-- ticket_price is the actual price attendees pay, calculated by admin before publishing
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS expected_attendees INTEGER;
