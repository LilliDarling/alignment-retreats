-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON public.channel_messages;

-- Create new delete policy that allows:
-- 1. Users to delete their own messages
-- 2. Server admins to delete any message in their server
-- 3. App admins to delete any message anywhere
CREATE POLICY "Users can delete own messages or admins can delete any"
ON public.channel_messages FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR (EXISTS (
    SELECT 1 FROM chat_channels c
    WHERE c.id = channel_messages.channel_id 
    AND is_server_admin(auth.uid(), c.server_id)
  ))
  OR has_role(auth.uid(), 'admin')
);