ALTER TABLE public.contact_submissions
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER set_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
