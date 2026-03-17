-- Add archived column to contact_submissions
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Allow admins to delete contact_submissions
CREATE POLICY "Admins can delete contact_submissions"
  ON contact_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
