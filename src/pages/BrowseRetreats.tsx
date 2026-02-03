import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { Leaf } from 'lucide-react';
import { RetreatCard } from '@/components/RetreatCard';

interface DbRetreat {
  id: string;
  title: string;
  description: string | null;
  retreat_type: string | null;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  sample_itinerary: string | null;
  status: string;
  host_user_id: string;
  location: string | null;
  host_profile_name?: string | null;
}

export default function BrowseRetreats() {
  usePageTitle('Browse Retreats');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real published retreats from database only
  const { data: retreats = [], isLoading } = useQuery({
    queryKey: ['published-retreats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select(
          'id,title,description,retreat_type,start_date,end_date,max_attendees,price_per_person,sample_itinerary,status,host_user_id,location'
        )
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const base = (data || []) as unknown as DbRetreat[];
      const hostIds = Array.from(new Set(base.map((r) => r.host_user_id).filter(Boolean)));

      if (hostIds.length === 0) return base;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', hostIds);

      if (profilesError) return base;

      const nameById = new Map((profiles || []).map((p) => [p.id, p.name]));
      return base.map((r) => ({
        ...r,
        host_profile_name: nameById.get(r.host_user_id) || null,
      }));
    },
  });


  return (
    <div className="min-h-screen bg-background">
      <AppHeader showSignOut={!!user} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {retreats.length} retreat{retreats.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Retreats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-accent mb-3" />
                <div className="h-4 bg-accent rounded w-3/4 mb-2" />
                <div className="h-4 bg-accent rounded w-1/2 mb-2" />
                <div className="h-4 bg-accent rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : retreats.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-accent mb-4">
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No retreats found
            </h3>
            <p className="text-muted-foreground mb-6">
              No retreats have been published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {retreats.map((retreat) => (
              <RetreatCard
                key={retreat.id}
                id={retreat.id}
                title={retreat.title}
                location={retreat.location || 'Location TBD'}
                image="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                startDate={retreat.start_date || ''}
                endDate={retreat.end_date || ''}
                pricePerPerson={retreat.price_per_person || 0}
                retreatType={retreat.retreat_type || 'Retreat'}
                maxAttendees={retreat.max_attendees || undefined}
                hostName={retreat.host_profile_name || undefined}
                sampleItinerary={retreat.sample_itinerary || undefined}
                onClick={() => navigate(`/retreat/${retreat.id}`)}
                onBook={() => navigate(`/retreat/${retreat.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}