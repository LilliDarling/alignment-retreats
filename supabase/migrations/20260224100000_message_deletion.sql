-- Add soft-delete columns for "delete conversation for just me" feature
ALTER TABLE public.messages
  ADD COLUMN deleted_for_sender BOOLEAN DEFAULT false,
  ADD COLUMN deleted_for_recipient BOOLEAN DEFAULT false;

-- Update SELECT policy to exclude soft-deleted messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
USING (
  (auth.uid() = sender_id AND NOT deleted_for_sender)
  OR (auth.uid() = recipient_id AND NOT deleted_for_recipient)
);

-- Allow sender or recipient to update messages (mark as read, soft-delete flags)
DROP POLICY IF EXISTS "Recipients can update messages" ON public.messages;
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Allow hard delete by sender or recipient
CREATE POLICY "Users can hard delete messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
