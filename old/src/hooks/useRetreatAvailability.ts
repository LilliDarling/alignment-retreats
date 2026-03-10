import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RetreatAvailability {
  retreat_id: string;
  max_attendees: number | null;
  current_bookings: number;
  spots_remaining: number | null;
  is_full: boolean;
}

export function useRetreatAvailability(retreatIds: string[]) {
  return useQuery({
    queryKey: ['retreat-availability', ...retreatIds.sort()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_retreat_availability', {
        retreat_ids: retreatIds,
      });
      if (error) throw error;
      return (data || []) as RetreatAvailability[];
    },
    enabled: retreatIds.length > 0,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useSingleRetreatAvailability(retreatId: string | undefined) {
  const query = useRetreatAvailability(retreatId ? [retreatId] : []);
  const availability = query.data?.find((a) => a.retreat_id === retreatId) ?? null;
  return { ...query, availability };
}
