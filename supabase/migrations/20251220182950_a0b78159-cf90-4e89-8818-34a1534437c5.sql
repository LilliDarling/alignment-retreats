-- Add cover_photo column to profiles
ALTER TABLE public.profiles ADD COLUMN cover_photo varchar;

-- Create RLS policy for role-dependent profile visibility
-- First drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy: public profiles for hosts/cohosts/staff, private for attendees
CREATE POLICY "Role-based profile visibility" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  auth.uid() = id
  OR 
  -- Public profiles for hosts, cohosts, and staff
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.id
    AND ur.role IN ('host', 'cohost', 'staff')
  )
);

-- Create messages table for in-app communication
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  retreat_id uuid REFERENCES public.retreats(id) ON DELETE SET NULL,
  subject varchar NOT NULL,
  body text NOT NULL,
  message_type varchar DEFAULT 'general',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can send messages
CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can update messages where they are recipient (mark as read)
CREATE POLICY "Recipients can update messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;