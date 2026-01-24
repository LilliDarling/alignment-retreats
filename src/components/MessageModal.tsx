import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string | null;
  recipientName?: string;
  recipientPhoto?: string;
  retreatId?: string;
  retreatTitle?: string;
  defaultMessageType?: 'booking_inquiry' | 'collaboration' | 'general';
}

export function MessageModal({
  open,
  onOpenChange,
  recipientId,
  recipientName = 'User',
  recipientPhoto,
  retreatId,
  retreatTitle,
  defaultMessageType = 'general',
}: MessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messageType, setMessageType] = useState(defaultMessageType);
  const [sending, setSending] = useState(false);

  const getDefaultSubject = () => {
    if (messageType === 'booking_inquiry' && retreatTitle) {
      return `Booking inquiry for ${retreatTitle}`;
    }
    if (messageType === 'collaboration' && retreatTitle) {
      return `Collaboration request for ${retreatTitle}`;
    }
    return '';
  };

  const handleSend = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to send messages.',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientId) {
      toast({
        title: 'Cannot send message',
        description: 'This is a sample retreat without a real host.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both subject and message.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        retreat_id: retreatId || null,
        subject: subject.trim(),
        body: body.trim(),
        message_type: messageType,
      });

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: `Your message has been sent to ${recipientName}.`,
      });

      setSubject('');
      setBody('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send a message</DialogTitle>
          <DialogDescription>
            {retreatTitle 
              ? `Regarding: ${retreatTitle}`
              : `Message to ${recipientName}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipientPhoto} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {recipientName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">To</p>
              <p className="font-medium text-foreground">{recipientName}</p>
            </div>
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label>Message type</Label>
            <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General inquiry</SelectItem>
                <SelectItem value="booking_inquiry">Booking inquiry</SelectItem>
                <SelectItem value="collaboration">Collaboration request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder={getDefaultSubject() || "Enter subject..."}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
