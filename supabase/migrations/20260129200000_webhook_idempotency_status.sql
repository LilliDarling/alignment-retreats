-- Add status column to track successful processing
-- This allows retries if business logic fails after event is recorded
ALTER TABLE public.processed_webhook_events
ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';

-- Add check constraint for valid statuses
ALTER TABLE public.processed_webhook_events
ADD CONSTRAINT processed_webhook_events_status_check
CHECK (status IN ('processing', 'completed', 'failed'));

-- Index for finding events that need retry
CREATE INDEX idx_processed_webhook_events_status
  ON public.processed_webhook_events (status)
  WHERE status != 'completed';
