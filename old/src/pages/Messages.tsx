import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Inbox,
  MessageCircle,
  Search,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function Messages() {
  usePageTitle('Messages');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose state (support message or ?to= param)
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState<{ id: string; name: string; photo: string } | null>(null);
  const [composeBody, setComposeBody] = useState('');

  // Delete state
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [deleteConversationUserId, setDeleteConversationUserId] = useState<string | null>(null);
  const [deleteConversationUserName, setDeleteConversationUserName] = useState('');

  // Handle ?to= URL param for compose
  const toUserId = searchParams.get('to');
  const { data: composeRecipient } = useQuery({
    queryKey: ['compose-recipient', toUserId],
    enabled: !!toUserId,
    queryFn: async () => {
      const { data } = await supabase
        .rpc('get_public_profiles', { profile_ids: [toUserId!] });
      return (data as any[])?.[0] || null;
    },
  });

  // Fetch an admin user for "Contact Support"
  const { data: adminUser } = useQuery({
    queryKey: ['admin-user'],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);
      if (!adminRoles?.length) return null;
      const adminId = adminRoles[0].user_id;
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { profile_ids: [adminId] });
      const profile = (profiles as any[])?.[0];
      return profile ? { id: adminId, name: profile.name || 'Support', photo: profile.profile_photo || '' } : null;
    },
    enabled: !!user?.id,
  });

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

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

  // Handle ?to= URL param — route to existing conversation or open compose
  useEffect(() => {
    if (toUserId && composeRecipient && messages) {
      const hasExisting = messages.some(
        m => m.sender_id === toUserId || m.recipient_id === toUserId
      );
      if (hasExisting) {
        setSelectedConversation(toUserId);
        setComposing(false);
      } else {
        setComposing(true);
        setComposeTo({
          id: toUserId,
          name: composeRecipient.name || 'User',
          photo: composeRecipient.profile_photo || '',
        });
        setSelectedConversation(null);
      }
    }
  }, [toUserId, composeRecipient, messages]);

  // Group messages into conversations
  const conversations: Conversation[] = (() => {
    if (!messages || !user?.id) return [];

    const convMap = new Map<string, Message[]>();
    for (const msg of messages) {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!convMap.has(otherUserId)) convMap.set(otherUserId, []);
      convMap.get(otherUserId)!.push(msg);
    }

    const result: Conversation[] = [];
    for (const [otherUserId, msgs] of convMap) {
      const lastMsg = msgs[msgs.length - 1];
      const otherProfile = lastMsg.sender_id === user.id
        ? lastMsg.recipient_profile
        : lastMsg.sender_profile;
      // Check all messages for a better profile (in case last message has no profile)
      let name = otherProfile?.name || 'Unknown User';
      let photo = otherProfile?.profile_photo || '';
      for (const m of msgs) {
        const p = m.sender_id === otherUserId ? m.sender_profile : m.recipient_profile;
        if (p?.name) { name = p.name; photo = p.profile_photo || ''; break; }
      }

      result.push({
        otherUserId,
        otherUserName: name,
        otherUserPhoto: photo,
        lastMessage: lastMsg,
        unreadCount: msgs.filter(m => m.recipient_id === user.id && !m.read).length,
        messages: msgs,
      });
    }

    // Sort by last message time, newest first
    result.sort((a, b) =>
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    return result;
  })();

  // Filter conversations by search
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherUserName.toLowerCase().includes(q) ||
      c.messages.some(m =>
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      )
    );
  });

  const activeConversation = conversations.find(c => c.otherUserId === selectedConversation);
  const unreadCount = messages?.filter(m => m.recipient_id === user?.id && !m.read).length || 0;

  // Scroll to bottom of thread when conversation changes or new message arrives
  useEffect(() => {
    if (activeConversation) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages.length, selectedConversation]);

  // Mark unread messages as read when opening a conversation
  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv.otherUserId);
    setComposing(false);
    setComposeTo(null);
    setMessageText('');

    // Clear URL param if present
    if (searchParams.has('to')) {
      searchParams.delete('to');
      setSearchParams(searchParams);
    }

    // Mark all unread messages in this conversation as read
    const unreadIds = conv.messages
      .filter(m => m.recipient_id === user?.id && !m.read)
      .map(m => m.id);
    if (unreadIds.length > 0) {
      markAsRead.mutate(unreadIds);
    }
  };

  // Send message in thread
  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return;

    setSending(true);
    try {
      const conv = activeConversation;
      const subject = conv?.messages[0]?.subject || 'Message';

      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        recipient_id: selectedConversation,
        subject,
        body: messageText.trim(),
        message_type: 'general',
      });

      if (error) throw error;
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error: any) {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Send new compose message
  const handleSendNewMessage = async () => {
    if (!composeTo || !composeBody.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        recipient_id: composeTo.id,
        subject: 'New conversation',
        body: composeBody.trim(),
        message_type: 'general',
      });

      if (error) throw error;

      toast({ title: 'Message sent!' });
      setComposing(false);
      setComposeTo(null);
      setComposeBody('');
      searchParams.delete('to');
      setSearchParams(searchParams);
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      // Select the new conversation
      setSelectedConversation(composeTo.id);
    } catch (error: any) {
      toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Delete mutations
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: 'Message deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting message', description: error.message, variant: 'destructive' });
    },
  });

  const deleteConversationForMe = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { error: err1 } = await supabase
        .from('messages')
        .update({ deleted_for_sender: true })
        .eq('sender_id', user?.id)
        .eq('recipient_id', otherUserId);
      if (err1) throw err1;
      const { error: err2 } = await supabase
        .from('messages')
        .update({ deleted_for_recipient: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user?.id);
      if (err2) throw err2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedConversation(null);
      toast({ title: 'Conversation deleted for you' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting conversation', description: error.message, variant: 'destructive' });
    },
  });

  const deleteConversationForEveryone = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { error: err1 } = await supabase
        .from('messages')
        .delete()
        .eq('sender_id', user?.id)
        .eq('recipient_id', otherUserId);
      if (err1) throw err1;
      const { error: err2 } = await supabase
        .from('messages')
        .delete()
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user?.id);
      if (err2) throw err2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedConversation(null);
      toast({ title: 'Conversation deleted for everyone' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting conversation', description: error.message, variant: 'destructive' });
    },
  });

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
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
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
          {adminUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // If we already have a conversation with admin, select it
                const existingConv = conversations.find(c => c.otherUserId === adminUser.id);
                if (existingConv) {
                  handleSelectConversation(existingConv);
                } else {
                  setComposing(true);
                  setSelectedConversation(null);
                  setComposeTo(adminUser);
                  setComposeBody('');
                }
              }}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Contact Support
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto" style={{ height: 'calc(100vh - 60px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden">
          {/* Conversation List */}
          <div className="md:col-span-1 border-r border-border overflow-y-auto h-full">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery.trim() ? 'No conversations match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => {
                  const lastMsg = conv.lastMessage;
                  const isLastFromMe = lastMsg.sender_id === user?.id;
                  const preview = isLastFromMe
                    ? `You: ${lastMsg.body}`
                    : lastMsg.body;

                  return (
                    <button
                      key={conv.otherUserId}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-accent/50 transition-colors",
                        selectedConversation === conv.otherUserId && "bg-accent",
                        conv.unreadCount > 0 && selectedConversation !== conv.otherUserId && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={conv.otherUserPhoto} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {conv.otherUserName.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-sm truncate",
                              conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                            )}>
                              {conv.otherUserName}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatMessageTime(lastMsg.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className={cn(
                              "text-sm truncate flex-1",
                              conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {preview}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 min-w-[1.25rem] px-1 text-xs rounded-full shrink-0">
                                {conv.unreadCount}
                              </Badge>
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

          {/* Thread / Compose */}
          <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
            {composing && composeTo ? (
              /* Compose new message to a specific user */
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={composeTo.photo} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {composeTo.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">
                        New message to {composeTo.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComposing(false);
                        setComposeTo(null);
                        searchParams.delete('to');
                        setSearchParams(searchParams);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Start a conversation with {composeTo.name}
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a message..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      rows={2}
                      className="resize-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendNewMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendNewMessage}
                      disabled={!composeBody.trim() || sending}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : activeConversation ? (
              /* Conversation Thread */
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeConversation.otherUserPhoto} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {activeConversation.otherUserName.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium text-foreground">
                        {activeConversation.otherUserName}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {activeConversation.messages.length} message{activeConversation.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive text-xs"
                      onClick={() => {
                        setDeleteConversationUserId(activeConversation.otherUserId);
                        setDeleteConversationUserName(activeConversation.otherUserName);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Thread Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                  {activeConversation.messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-3 group", isMe && "flex-row-reverse")}
                      >
                        <Avatar className="h-8 w-8 shrink-0 mt-1">
                          <AvatarImage
                            src={msg.sender_profile?.profile_photo}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {msg.sender_profile?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[70%] space-y-1", isMe && "items-end")}>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-md"
                                : "bg-muted rounded-tl-md"
                            )}
                          >
                            {msg.body}
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 px-1",
                            isMe && "flex-row-reverse"
                          )}>
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isMe && (
                              <button
                                onClick={() => setDeleteMessageId(msg.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Select a conversation to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete individual message confirmation */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message for both you and the other person.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteMessageId) deleteMessage.mutate(deleteMessageId);
                setDeleteMessageId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete conversation confirmation */}
      <AlertDialog open={!!deleteConversationUserId} onOpenChange={(open) => !open && setDeleteConversationUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation with {deleteConversationUserName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you'd like to delete this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => {
                if (deleteConversationUserId) deleteConversationForMe.mutate(deleteConversationUserId);
                setDeleteConversationUserId(null);
              }}
            >
              Delete for me
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConversationUserId) deleteConversationForEveryone.mutate(deleteConversationUserId);
                setDeleteConversationUserId(null);
              }}
            >
              Delete for everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
