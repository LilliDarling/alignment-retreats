import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { 
  Leaf,
  SlidersHorizontal,
  Map as MapIcon
} from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { CategoryStrip } from '@/components/CategoryStrip';
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
  property_id?: string | null;
  properties?: any;
  host_profile_name?: string | null;
}

const categoryMap: Record<string, string> = {
  'yoga': 'Yoga & Wellness',
  'meditation': 'Meditation & Mindfulness',
  'creative': 'Creative & Artistic',
  'adventure': 'Adventure & Outdoor',
  'spiritual': 'Spiritual & Healing',
  'leadership': 'Leadership & Personal Growth',
  'couples': 'Couples & Relationships',
  'corporate': 'Corporate & Team Building',
};

export default function BrowseRetreats() {
  usePageTitle('Browse Retreats');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({ location: '', type: 'All Types' });

  // Fetch real published retreats from database only
  const { data: retreats = [], isLoading } = useQuery({
    queryKey: ['published-retreats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select(
          'id,title,description,retreat_type,start_date,end_date,max_attendees,price_per_person,sample_itinerary,status,host_user_id,property_id,properties_public!retreats_property_id_fkey(location)'
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

  // Filter retreats based on category and search
  const filteredRetreats = retreats.filter((retreat) => {
    // Category filter
    if (selectedCategory) {
      const categoryType = categoryMap[selectedCategory];
      if (retreat.retreat_type !== categoryType) return false;
    }

    // Search filter
    if (searchFilters.location) {
      const searchLower = searchFilters.location.toLowerCase();
      const matchesTitle = retreat.title.toLowerCase().includes(searchLower);
      const matchesDesc = retreat.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDesc) return false;
    }

    if (searchFilters.type !== 'All Types') {
      if (retreat.retreat_type !== searchFilters.type) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showSignOut={!!user} />

      {/* Mobile Search */}
      <div className="lg:hidden px-4 py-3 border-b border-border bg-card">
        <SearchBar onSearch={setSearchFilters} />
      </div>

      {/* Category Strip */}
      <div className="border-b border-border bg-card sticky top-[60px] lg:top-[60px] z-40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <CategoryStrip 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 pl-4 border-l border-border">
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-2 hidden sm:flex">
              <MapIcon className="h-4 w-4" />
              Map
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredRetreats.length} retreat{filteredRetreats.length !== 1 ? 's' : ''} available
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
        ) : filteredRetreats.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-accent mb-4">
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No retreats found
            </h3>
            <p className="text-muted-foreground mb-6">
              {retreats.length === 0 
                ? 'No retreats have been published yet. Check back soon!' 
                : 'Try adjusting your filters or search terms'}
            </p>
            {(selectedCategory || searchFilters.location || searchFilters.type !== 'All Types') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchFilters({ location: '', type: 'All Types' });
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRetreats.map((retreat) => (
              <RetreatCard
                key={retreat.id}
                id={retreat.id}
                title={retreat.title}
                location={
                  (Array.isArray((retreat as any).properties_public)
                    ? (retreat as any).properties_public?.[0]?.location
                    : (retreat as any).properties_public?.location) || 'Location TBD'
                }
                image="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                startDate={retreat.start_date || ''}
                endDate={retreat.end_date || ''}
                pricePerPerson={retreat.price_per_person || 0}
                retreatType={retreat.retreat_type || 'Retreat'}
                maxAttendees={retreat.max_attendees || undefined}
                hostName={retreat.host_profile_name || undefined}
                sampleItinerary={retreat.sample_itinerary || undefined}
                onClick={() => {
                  if (!user) {
                    navigate('/signup', { state: { returnTo: '/retreats/browse' } });
                  } else {
                    navigate(`/retreat/${retreat.id}`);
                  }
                }}
                onBook={() => {
                  if (!user) {
                    navigate('/signup', { state: { returnTo: '/retreats/browse' } });
                  } else {
                    navigate(`/retreat/${retreat.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}