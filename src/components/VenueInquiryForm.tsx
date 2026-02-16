import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

const inquirySchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredDates: z.string().optional(),
  guestCount: z.number().min(1, 'Guest count must be at least 1').optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface VenueInquiryFormProps {
  propertyId: string;
  venueName: string;
  onSuccess?: () => void;
}

export function VenueInquiryForm({ propertyId, venueName, onSuccess }: VenueInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      message: '',
      preferredDates: '',
      guestCount: undefined,
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to send an inquiry',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('venue_inquiries').insert({
        property_id: propertyId,
        inquirer_user_id: user.id,
        message: data.message,
        preferred_dates: data.preferredDates || null,
        guest_count: data.guestCount || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Inquiry sent!',
        description: 'The venue owner will get back to you soon.',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: 'Failed to send inquiry',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground mb-4">Sign in to inquire about this venue</p>
        <Button asChild>
          <a href="/login">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div id="inquire" className="rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Inquire About {venueName}</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell the venue owner about your retreat plans..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Describe your retreat and what you're looking for</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preferred Dates */}
          <FormField
            control={form.control}
            name="preferredDates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Dates (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., June 2026 or flexible" {...field} />
                </FormControl>
                <FormDescription>When would you like to host your retreat?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guest Count */}
          <FormField
            control={form.control}
            name="guestCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Guest Count (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="20"
                    {...field}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>How many guests do you expect?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Inquiry
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
