import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Mail, 
  MailOpen, 
  Send,
  Inbox,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  retreat_id: string | null;
  subject: string;
  body: string;
  message_type: string;
  read: boolean;
  created_at: string;
  sender_profile?: {
    name: string;
    profile_photo: string;
  };
  recipient_profile?: {
    name: string;
    profile_photo: string;
  };
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each unique user
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.recipient_id]) || [])];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .rpc('get_public_profiles', { profile_ids: userIds });

        const profileMap = new Map((profiles as any[])?.map((p: any) => [p.id, p]) || []);

        return data?.map(msg => ({
          ...msg,
          sender_profile: profileMap.get(msg.sender_id),
          recipient_profile: profileMap.get(msg.recipient_id),
        })) || [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Handle message selection
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setReplyText('');
    
    // Mark as read if user is recipient and message is unread
    if (message.recipient_id === user?.id && !message.read) {
      markAsRead.mutate(message.id);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSending(true);

    try {
      const recipientId = selectedMessage.sender_id === user?.id 
        ? selectedMessage.recipient_id 
        : selectedMessage.sender_id;

      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        recipient_id: recipientId,
        retreat_id: selectedMessage.retreat_id,
        subject: `Re: ${selectedMessage.subject}`,
        body: replyText.trim(),
        message_type: selectedMessage.message_type,
      });

      if (error) throw error;

      toast({
        title: 'Reply sent!',
        description: 'Your reply has been sent successfully.',
      });

      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error: any) {
      toast({
        title: 'Error sending reply',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'booking_inquiry':
        return <Badge variant="secondary" className="text-xs">Booking</Badge>;
      case 'collaboration':
        return <Badge variant="outline" className="text-xs border-primary/30 text-primary">Collaboration</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">General</Badge>;
    }
  };

  const unreadCount = messages?.filter(m => m.recipient_id === user?.id && !m.read).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <h1 className="font-semibold text-foreground">Messages</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto h-[calc(100vh-60px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Message List */}
          <div className="md:col-span-1 border-r border-border overflow-y-auto">
            {messages?.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages?.map((message) => {
                  const isReceived = message.recipient_id === user?.id;
                  const otherUser = isReceived ? message.sender_profile : message.recipient_profile;
                  
                  return (
                    <button
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-accent/50 transition-colors",
                        selectedMessage?.id === message.id && "bg-accent",
                        isReceived && !message.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={otherUser?.profile_photo} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {otherUser?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "font-medium text-sm truncate",
                              isReceived && !message.read && "text-foreground",
                              (message.read || !isReceived) && "text-muted-foreground"
                            )}>
                              {otherUser?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {format(new Date(message.created_at), 'MMM d')}
                            </span>
                          </div>
                          <p className={cn(
                            "text-sm truncate",
                            isReceived && !message.read ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {message.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getMessageTypeBadge(message.message_type)}
                            {isReceived && !message.read && (
                              <Mail className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="md:col-span-2 flex flex-col">
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={
                        selectedMessage.sender_id === user?.id 
                          ? selectedMessage.recipient_profile?.profile_photo
                          : selectedMessage.sender_profile?.profile_photo
                      } />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(selectedMessage.sender_id === user?.id 
                          ? selectedMessage.recipient_profile?.name
                          : selectedMessage.sender_profile?.name)?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {selectedMessage.sender_id === user?.id 
                            ? `To: ${selectedMessage.recipient_profile?.name || 'Unknown'}`
                            : `From: ${selectedMessage.sender_profile?.name || 'Unknown'}`}
                        </span>
                        {getMessageTypeBadge(selectedMessage.message_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedMessage.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    {selectedMessage.subject}
                  </h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.body}
                  </p>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <Button 
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Select a message to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
