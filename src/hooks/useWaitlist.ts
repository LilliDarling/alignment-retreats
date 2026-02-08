import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWaitlistStatus(retreatId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['waitlist-status', retreatId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreat_waitlist')
        .select('id, position, created_at')
        .eq('retreat_id', retreatId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!retreatId && !!user,
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retreatId: string) => {
      const { data, error } = await supabase.rpc('join_retreat_waitlist', {
        _retreat_id: retreatId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, retreatId) => {
      const position = Array.isArray(data) ? data[0]?.position : null;
      toast.success('Added to waitlist', {
        description: position ? `You are #${position} on the waitlist.` : 'We\'ll notify you if a spot opens up.',
      });
      queryClient.invalidateQueries({ queryKey: ['waitlist-status', retreatId] });
    },
    onError: (err: Error) => {
      toast.error('Could not join waitlist', { description: err.message });
    },
  });
}

export function useLeaveWaitlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (retreatId: string) => {
      const { error } = await supabase
        .from('retreat_waitlist')
        .delete()
        .eq('retreat_id', retreatId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_, retreatId) => {
      toast.success('Removed from waitlist');
      queryClient.invalidateQueries({ queryKey: ['waitlist-status', retreatId] });
    },
    onError: (err: Error) => {
      toast.error('Could not leave waitlist', { description: err.message });
    },
  });
}
