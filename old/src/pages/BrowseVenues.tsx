import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { VenueCard } from '@/components/VenueCard';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Loader2, MapPin } from 'lucide-react';

const PAGE_SIZE = 12;

export default function BrowseVenues() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['published-venues-browse'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    initialPageParam: 0,
  });

  const venues = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Browse Retreat Venues"
        description="Discover beautiful venues and retreat centers for your next wellness retreat. Browse locations worldwide."
        canonical="/venues/browse"
      />
      <AppHeader />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Retreat Venues</h1>
          <p className="text-muted-foreground text-lg">
            Discover the perfect space for your next retreat
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">Failed to load venues. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && venues.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No venues found</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to list your venue!
            </p>
            <Button asChild>
              <a href="/venues/submit">Submit Your Venue</a>
            </Button>
          </div>
        )}

        {/* Venues Grid */}
        {venues.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  id={venue.id}
                  name={venue.name}
                  location={venue.location || undefined}
                  images={venue.photos || []}
                  propertyType={venue.property_type}
                  capacity={venue.capacity || undefined}
                  basePrice={venue.base_price || undefined}
                  minRate={venue.min_rate || undefined}
                  maxRate={venue.max_rate || undefined}
                  amenities={venue.amenities || []}
                  description={venue.description || undefined}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="lg"
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
      </div>
    </div>
  );
}
