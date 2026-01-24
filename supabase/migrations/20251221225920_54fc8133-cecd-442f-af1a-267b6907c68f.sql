-- Drop existing restrictive policies on chat_servers
DROP POLICY IF EXISTS "Authenticated users can create servers" ON public.chat_servers;
DROP POLICY IF EXISTS "Users can view servers they are members of" ON public.chat_servers;
DROP POLICY IF EXISTS "Server admins can update their servers" ON public.chat_servers;
DROP POLICY IF EXISTS "Server owners can delete their servers" ON public.chat_servers;

-- Recreate as PERMISSIVE policies (default)

-- Allow authenticated users to create servers
CREATE POLICY "Authenticated users can create servers"
ON public.chat_servers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view servers they are members of
CREATE POLICY "Users can view servers they are members of"
ON public.chat_servers FOR SELECT
TO authenticated
USING (is_server_member(auth.uid(), id));

-- Allow creators to view their own servers (needed for returning data after insert before membership is added)
CREATE POLICY "Creators can view their own servers"
ON public.chat_servers FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Allow server admins to update their servers
CREATE POLICY "Server admins can update their servers"
ON public.chat_servers FOR UPDATE
TO authenticated
USING (is_server_admin(auth.uid(), id));

-- Allow server owners to delete their servers
CREATE POLICY "Server owners can delete their servers"
ON public.chat_servers FOR DELETE
TO authenticated
USING (created_by = auth.uid());