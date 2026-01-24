-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for server member roles
CREATE TYPE public.server_role AS ENUM ('owner', 'admin', 'member');

-- Create chat_servers table
CREATE TABLE public.chat_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_channels table
CREATE TABLE public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.chat_servers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create server_members table
CREATE TABLE public.server_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.chat_servers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role server_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (server_id, user_id)
);

-- Create channel_messages table
CREATE TABLE public.channel_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check server membership
CREATE OR REPLACE FUNCTION public.is_server_member(_user_id UUID, _server_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.server_members
        WHERE user_id = _user_id
          AND server_id = _server_id
    )
$$;

-- Security definer function to check server admin/owner
CREATE OR REPLACE FUNCTION public.is_server_admin(_user_id UUID, _server_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.server_members
        WHERE user_id = _user_id
          AND server_id = _server_id
          AND role IN ('owner', 'admin')
    )
$$;

-- RLS Policies for chat_servers
CREATE POLICY "Users can view servers they are members of"
ON public.chat_servers FOR SELECT
USING (public.is_server_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create servers"
ON public.chat_servers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Server admins can update their servers"
ON public.chat_servers FOR UPDATE
USING (public.is_server_admin(auth.uid(), id));

CREATE POLICY "Server owners can delete their servers"
ON public.chat_servers FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for chat_channels
CREATE POLICY "Members can view channels in their servers"
ON public.chat_channels FOR SELECT
USING (public.is_server_member(auth.uid(), server_id));

CREATE POLICY "Admins can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (public.is_server_admin(auth.uid(), server_id));

CREATE POLICY "Admins can update channels"
ON public.chat_channels FOR UPDATE
USING (public.is_server_admin(auth.uid(), server_id));

CREATE POLICY "Admins can delete channels"
ON public.chat_channels FOR DELETE
USING (public.is_server_admin(auth.uid(), server_id));

-- RLS Policies for server_members
CREATE POLICY "Members can view other members"
ON public.server_members FOR SELECT
USING (public.is_server_member(auth.uid(), server_id));

CREATE POLICY "Admins can add members"
ON public.server_members FOR INSERT
WITH CHECK (public.is_server_admin(auth.uid(), server_id) OR auth.uid() = user_id);

CREATE POLICY "Admins can update member roles"
ON public.server_members FOR UPDATE
USING (public.is_server_admin(auth.uid(), server_id));

CREATE POLICY "Admins can remove members or users can leave"
ON public.server_members FOR DELETE
USING (public.is_server_admin(auth.uid(), server_id) OR auth.uid() = user_id);

-- RLS Policies for channel_messages
CREATE POLICY "Members can view messages in their servers"
ON public.channel_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = channel_id
        AND public.is_server_member(auth.uid(), c.server_id)
    )
);

CREATE POLICY "Members can send messages"
ON public.channel_messages FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = channel_id
        AND public.is_server_member(auth.uid(), c.server_id)
    )
);

CREATE POLICY "Users can edit their own messages"
ON public.channel_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages or admins can delete any"
ON public.channel_messages FOR DELETE
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = channel_id
        AND public.is_server_admin(auth.uid(), c.server_id)
    )
);

-- Create indexes for performance
CREATE INDEX idx_chat_channels_server_id ON public.chat_channels(server_id);
CREATE INDEX idx_server_members_server_id ON public.server_members(server_id);
CREATE INDEX idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX idx_channel_messages_channel_id ON public.channel_messages(channel_id);
CREATE INDEX idx_channel_messages_created_at ON public.channel_messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;

-- Triggers for updated_at
CREATE TRIGGER update_chat_servers_updated_at
BEFORE UPDATE ON public.chat_servers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();