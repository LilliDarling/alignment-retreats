-- Add an 'admin' role to the existing enum (append-only)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';