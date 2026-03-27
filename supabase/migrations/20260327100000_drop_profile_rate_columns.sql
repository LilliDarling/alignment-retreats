-- Drop the legacy directory_profiles view if it still exists (it was replaced by a function)
DROP VIEW IF EXISTS public.directory_profiles;

ALTER TABLE profiles DROP COLUMN IF EXISTS rate;
ALTER TABLE profiles DROP COLUMN IF EXISTS rate_currency;
