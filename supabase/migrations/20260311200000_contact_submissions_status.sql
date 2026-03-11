-- Add read/resolved status tracking to contact_submissions
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false;

-- Allow admins to update contact_submissions (mark read/resolved)
CREATE POLICY "Admins can update contact_submissions"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
