-- Webhook idempotency: prevent duplicate processing of Stripe events
CREATE TABLE public.processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup queries
CREATE INDEX idx_processed_webhook_events_processed_at
  ON public.processed_webhook_events (processed_at);

-- No RLS needed - only accessed by service role from edge functions
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
