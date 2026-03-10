-- Add missing team_member_role enum values to match looking_for options
ALTER TYPE team_member_role ADD VALUE IF NOT EXISTS 'photographer';
ALTER TYPE team_member_role ADD VALUE IF NOT EXISTS 'yoga_instructor';
ALTER TYPE team_member_role ADD VALUE IF NOT EXISTS 'sound_healer';
ALTER TYPE team_member_role ADD VALUE IF NOT EXISTS 'massage';
