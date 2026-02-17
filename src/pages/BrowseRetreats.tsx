import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRetreatAvailability } from '@/hooks/useRetreatAvailability';
import { AppHeader } from '@/components/AppHeader';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, X } from 'lucide-react';

import { RetreatCard } from '@/components/RetreatCard';

const PAGE_SIZE = 12;

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
  custom_venue_name: string | null;
  host_user_id: string;
}

export default function BrowseRetreats() {
  usePageTitle('Browse Retreats');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Fetch published venues for filter
  const { data: venues } = useQuery({
    queryKey: ['published-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('status', 'published')
        .order('name') as unknown as { data: { id: string; name: string; location: string | null }[] | null; error: unknown };

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch published retreats with pagination and optional venue filter
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['published-retreats', selectedVenueId],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('retreats')
        .select(
          'id,title,description,retreat_type,start_date,end_date,max_attendees,price_per_person,sample_itinerary,status,custom_venue_name,host_user_id'
        )
        .eq('status', 'published');

      // Apply venue filter if selected
      if (selectedVenueId) {
        query = query.eq('property_id', selectedVenueId);
      }

      const { data, error } = await query
        .order('start_date', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return (data || []) as unknown as DbRetreat[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });

  const retreats = data?.pages.flat() ?? [];
  const retreatIds = retreats.map((r) => r.id);
  const { data: availabilityData = [] } = useRetreatAvailability(retreatIds);
  const availabilityMap = new Map(availabilityData.map((a) => [a.retreat_id, a]));

  const hostUserIds = [...new Set(retreats.map((r) => r.host_user_id).filter(Boolean))];
  const { data: hostProfiles = [] } = useQuery({
    queryKey: ['host-profiles', hostUserIds],
    queryFn: async () => {
      if (hostUserIds.length === 0) return [];
      const { data } = await supabase.from('profiles').select('id,name').in('id', hostUserIds);
      return data || [];
    },
    enabled: hostUserIds.length > 0,
  });
  const profileMap = new Map(hostProfiles.map((p) => [p.id, p]));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Browse Retreats"
        description="Browse and book transformative retreats for alignment, wellness, and personal growth. Find your perfect retreat experience."
        canonical="/retreats/browse"
      />
      {/* Announcement Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-2 sm:px-4">
        <div className="container mx-auto text-center text-[11px] sm:text-sm whitespace-nowrap">
          <span>Want to host retreats in 2026?</span>
          <Link to="/get-started" className="font-semibold underline hover:opacity-80 ml-1 sm:ml-2">
            Join now
          </Link>
        </div>
      </div>

      <AppHeader showSignOut={!!user} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filter Section */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Select
              value={selectedVenueId || 'all'}
              onValueChange={(value) => setSelectedVenueId(value === 'all' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    All Venues
                  </span>
                </SelectItem>
                {venues?.map(venue => (
                  <SelectItem key={venue.id} value={venue.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{venue.name}</span>
                      {venue.location && (
                        <span className="text-xs text-muted-foreground">
                          ({venue.location})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Badge */}
          {selectedVenueId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVenueId(null)}
              className="gap-2"
            >
              <span className="text-sm">
                {venues?.find(v => v.id === selectedVenueId)?.name}
              </span>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {retreats.length} retreat{retreats.length !== 1 ? 's' : ''} loaded
            {selectedVenueId && ' at this venue'}
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
              <img src="/2tb.svg" alt="" className="h-12 w-12 opacity-50" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No retreats found
            </h3>
            <p className="text-muted-foreground mb-6">
              No retreats have been published yet. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {retreats.map((retreat) => {
                const avail = availabilityMap.get(retreat.id);
                return (
                  <RetreatCard
                    key={retreat.id}
                    id={retreat.id}
                    title={retreat.title}
                    location={retreat.custom_venue_name || 'Location TBD'}
                    image="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                    startDate={retreat.start_date || ''}
                    endDate={retreat.end_date || ''}
                    pricePerPerson={retreat.price_per_person || 0}
                    retreatType={retreat.retreat_type || 'Retreat'}
                    maxAttendees={retreat.max_attendees || undefined}
                    spotsRemaining={avail?.spots_remaining ?? null}
                    isFull={avail?.is_full ?? false}
                    hostName={profileMap.get(retreat.host_user_id)?.name || undefined}
                    sampleItinerary={retreat.sample_itinerary || undefined}
                    onClick={() => navigate(`/retreat/${retreat.id}`)}
                    onBook={() => navigate(`/retreat/${retreat.id}`)}
                  />
                );
              })}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
