import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Search, Filter, X, Users } from 'lucide-react';
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
  name: string | null;
  profile_photo: string | null;
  bio: string | null;
  roles: string[];
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
  landowner: 'Venue Owner',
  staff: 'Staff',
};

export default function Directory() {
  usePageTitle('Member Directory');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch profiles that opted into the directory, then enrich with roles
  const { data: allProfiles, isLoading } = useQuery({
    queryKey: ['directory-profiles'],
    queryFn: async (): Promise<DirectoryProfile[]> => {
      // Get profiles that opted into directory
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .eq('show_in_directory', true)
        .order('name', { ascending: true });

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      // Get roles for all these users
      const userIds = profilesData.map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Build a role map
      const roleMap = new Map<string, string[]>();
      for (const r of rolesData || []) {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
        roleMap.get(r.user_id)!.push(r.role);
      }

      return profilesData
        .filter(p => p.name && p.name.trim().length > 0)
        .map(p => ({
          ...p,
          roles: roleMap.get(p.id) || [],
        }))
        .filter(p => p.roles.length > 0);
    },
    enabled: !!user?.id,
  });

  // Client-side filtering
  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return [];

    return allProfiles.filter((profile) => {
      // Role filter
      if (roleFilter !== 'all') {
        if (!profile.roles.includes(roleFilter)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = profile.name?.toLowerCase().includes(q);
        const bioMatch = profile.bio?.toLowerCase().includes(q);
        if (!nameMatch && !bioMatch) return false;
      }

      return true;
    });
  }, [allProfiles, roleFilter, searchQuery]);

  // Paginate client-side
  const profiles = filteredProfiles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProfiles.length;

  // Reset visible count when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setVisibleCount(PAGE_SIZE);
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
              placeholder="Search by name or bio..."
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
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="landowner">Venue Owners</SelectItem>
              <SelectItem value="attendee">Attendees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          {filteredProfiles.length} member{filteredProfiles.length !== 1 ? 's' : ''} found
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
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <Avatar className="h-20 w-20 mb-4 border-2 border-border">
                      <AvatarImage src={profile.profile_photo || undefined} alt={profile.name || 'User'} />
                      <AvatarFallback className="text-xl">
                        {profile.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {profile.name || 'Unknown'}
                      </h3>
                    </div>

                    {/* Roles */}
                    {profile.roles.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                        {profile.roles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {ROLE_LABELS[role] || role}
                          </Badge>
                        ))}
                        {profile.roles.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.roles.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
