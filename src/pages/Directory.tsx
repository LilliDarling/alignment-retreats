import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Search, Filter, X, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 12;

interface DirectoryProfile {
  id: string;
  name: string;
  email: string;
  profile_photo: string | null;
  bio: string;
  user_roles: string[];
  expertise_areas: string[];
  location: string;
  years_experience: number | null;
  availability_status: string;
  verified: boolean;
  profile_completed: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  host: 'Retreat Host',
  cohost: 'Co-Host',
  chef: 'Chef/Cook',
  photographer: 'Photographer',
  videographer: 'Videographer',
  yoga_instructor: 'Yoga Instructor',
  meditation_guide: 'Meditation Guide',
  facilitator: 'Workshop Facilitator',
  massage_therapist: 'Massage Therapist',
  sound_healer: 'Sound Healer',
  attendee: 'Retreat Attendee',
};

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  limited: { label: 'Limited', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  booked: { label: 'Booked', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  not_available: { label: 'Unavailable', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
};

export default function Directory() {
  usePageTitle('Member Directory');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Fetch profiles with pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['directory-profiles', searchQuery, roleFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('profiles')
        .select('id, name, email, profile_photo, bio, user_roles, expertise_areas, location, years_experience, availability_status, verified, profile_completed')
        .eq('profile_completed', true);

      // Apply role filter if not "all"
      if (roleFilter !== 'all') {
        query = query.contains('user_roles', [roleFilter]);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query
        .order('name', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return (data || []) as DirectoryProfile[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });

  const profiles = data?.pages.flat() ?? [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Member Directory"
        description="Browse and connect with retreat hosts, co-hosts, facilitators, and service providers in the Alignment Retreats community."
        canonical="/directory"
      />
      <AppHeader showSignOut={!!user} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Member Directory</h1>
          <p className="text-muted-foreground">
            Find and connect with hosts, facilitators, and service providers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, bio, or location..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="host">Retreat Hosts</SelectItem>
              <SelectItem value="cohost">Co-Hosts</SelectItem>
              <SelectItem value="chef">Chefs</SelectItem>
              <SelectItem value="photographer">Photographers</SelectItem>
              <SelectItem value="videographer">Videographers</SelectItem>
              <SelectItem value="yoga_instructor">Yoga Instructors</SelectItem>
              <SelectItem value="meditation_guide">Meditation Guides</SelectItem>
              <SelectItem value="facilitator">Facilitators</SelectItem>
              <SelectItem value="massage_therapist">Massage Therapists</SelectItem>
              <SelectItem value="sound_healer">Sound Healers</SelectItem>
              <SelectItem value="attendee">Attendees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          {profiles.length} member{profiles.length !== 1 ? 's' : ''} found
        </div>

        {/* Profile Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex flex-col items-center space-y-3">
                  <div className="h-20 w-20 rounded-full bg-accent" />
                  <div className="h-4 w-32 bg-accent rounded" />
                  <div className="h-3 w-24 bg-accent rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => {
                const availInfo = AVAILABILITY_LABELS[profile.availability_status] || AVAILABILITY_LABELS.not_available;

                return (
                  <Card
                    key={profile.id}
                    className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <Avatar className="h-20 w-20 mb-4 border-2 border-border">
                        <AvatarImage src={profile.profile_photo || undefined} alt={profile.name} />
                        <AvatarFallback className="text-xl">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name & Verification */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {profile.name}
                        </h3>
                        {profile.verified && (
                          <Badge variant="default" className="mt-1 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* Location & Experience */}
                      <div className="text-sm text-muted-foreground mb-3 space-y-1">
                        {profile.location && <div>{profile.location}</div>}
                        {profile.years_experience && (
                          <div>{profile.years_experience} years experience</div>
                        )}
                      </div>

                      {/* Roles */}
                      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                        {profile.user_roles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {ROLE_LABELS[role] || role}
                          </Badge>
                        ))}
                        {profile.user_roles.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.user_roles.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Expertise */}
                      {profile.expertise_areas.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mb-3">
                          {profile.expertise_areas.slice(0, 2).map((area) => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {profile.expertise_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.expertise_areas.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {profile.bio}
                        </p>
                      )}

                      {/* Availability */}
                      <Badge variant="outline" className={`text-xs ${availInfo.color}`}>
                        {availInfo.label}
                      </Badge>
                    </div>
                  </Card>
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
