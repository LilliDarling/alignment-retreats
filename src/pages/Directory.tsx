import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Search, Filter, Star, CheckCircle, Lock, Users, Briefcase, Home, ChefHat, X, Building, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DirectoryProfile {
  id: string;
  name: string | null;
  profile_photo: string | null;
  bio: string | null;
  roles: string[];
  host_verified: boolean | null;
  expertise_areas: string[] | null;
  host_rating: number | null;
  past_retreats_count: number | null;
  host_min_rate: number | null;
  host_max_rate: number | null;
  cohost_verified: boolean | null;
  skills: string[] | null;
  cohost_hourly_rate: number | null;
  cohost_min_rate: number | null;
  cohost_max_rate: number | null;
  cohost_rating: number | null;
  cohost_availability: string | null;
  past_collaborations_count: number | null;
  staff_verified: boolean | null;
  service_type: string | null;
  staff_day_rate: number | null;
  staff_min_rate: number | null;
  staff_max_rate: number | null;
  staff_rating: number | null;
  experience_years: number | null;
  staff_availability: string | null;
  portfolio_url: string | null;
  is_verified: boolean;
  // Landowner/property fields
  property_name: string | null;
  property_location: string | null;
  property_capacity: number | null;
  property_base_price: number | null;
  property_type: string | null;
  property_min_rate: number | null;
  property_max_rate: number | null;
}

const roleIcons: Record<string, React.ReactNode> = {
  host: <Home className="h-3 w-3" />,
  cohost: <Users className="h-3 w-3" />,
  staff: <Briefcase className="h-3 w-3" />,
  landowner: <Building className="h-3 w-3" />,
};

const roleLabels: Record<string, string> = {
  host: 'Host',
  cohost: 'Co-Host',
  staff: 'Staff',
  landowner: 'Landowner',
};

const roleColors: Record<string, string> = {
  host: 'bg-primary/10 text-primary border-primary/20',
  cohost: 'bg-secondary/10 text-secondary border-secondary/20',
  staff: 'bg-accent text-accent-foreground border-border',
  landowner: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
};

export default function Directory() {
  usePageTitle('Member Directory');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  // Check if current user is admin
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Check if current user is verified (or admin)
  const { data: isViewerVerified } = useQuery({
    queryKey: ['isViewerVerified', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('is_user_verified', { _user_id: user.id });
      if (error) {
        console.error('Error checking verification:', error);
        return false;
      }
      return data ?? false;
    },
    enabled: !!user?.id && !isAdmin, // Skip if admin
  });

  // Admins always see rates
  const canSeeRates = isAdmin || isViewerVerified;

  // Fetch directory profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['directoryProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_directory_profiles');
      if (error) throw error;
      return data as DirectoryProfile[];
    },
  });

  // Reset visible count when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(12);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setVisibleCount(12);
  };

  // Filter profiles
  const filteredProfiles = profiles?.filter(profile => {
    const matchesSearch = !searchQuery ||
      profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      profile.expertise_areas?.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      profile.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.property_location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || profile.roles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  const visibleProfiles = filteredProfiles?.slice(0, visibleCount);
  const hasMore = (filteredProfiles?.length ?? 0) > visibleCount;

  const formatPriceRange = (min: number | null, max: number | null, unit: string) => {
    if (min && max) {
      return `$${min} - $${max}${unit}`;
    } else if (min) {
      return `From $${min}${unit}`;
    } else if (max) {
      return `Up to $${max}${unit}`;
    }
    return null;
  };

  const getRating = (profile: DirectoryProfile) => {
    return profile.host_rating || profile.cohost_rating || profile.staff_rating;
  };

  const getPriceDisplay = (profile: DirectoryProfile) => {
    const prices: string[] = [];
    
    // Host rates
    const hostRate = formatPriceRange(profile.host_min_rate, profile.host_max_rate, '/retreat');
    if (hostRate) prices.push(hostRate);
    
    // Cohost rates
    if (profile.cohost_hourly_rate) {
      prices.push(`$${profile.cohost_hourly_rate}/hr`);
    } else {
      const cohostRate = formatPriceRange(profile.cohost_min_rate, profile.cohost_max_rate, '/hr');
      if (cohostRate) prices.push(cohostRate);
    }
    
    // Staff rates
    if (profile.staff_day_rate) {
      prices.push(`$${profile.staff_day_rate}/day`);
    } else {
      const staffRate = formatPriceRange(profile.staff_min_rate, profile.staff_max_rate, '/day');
      if (staffRate) prices.push(staffRate);
    }
    
    // Property/landowner rates
    if (profile.property_base_price) {
      prices.push(`$${profile.property_base_price}/night`);
    } else {
      const propertyRate = formatPriceRange(profile.property_min_rate, profile.property_max_rate, '/night');
      if (propertyRate) prices.push(propertyRate);
    }
    
    return prices.length > 0 ? prices.join(' • ') : 'Rates not set';
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Member Directory" noindex />
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Member Directory</h1>
          <p className="text-muted-foreground">
            Find and connect with hosts, co-hosts, staff, and property owners
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or expertise..."
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="host">Hosts</SelectItem>
              <SelectItem value="cohost">Co-Hosts</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="landowner">Landowners</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verification Notice */}
        {!canSeeRates && (
          <div className="bg-accent/50 border border-border rounded-xl p-4 mb-8 flex items-start gap-3">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Pricing is hidden</p>
              <p className="text-sm text-muted-foreground">
                Get verified to see service provider rates. Contact an admin to request verification.
              </p>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredProfiles?.length ?? 0} members found
        </div>

        {/* Profile Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProfiles?.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No profiles found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProfiles?.map((profile) => (
              <Card 
                key={profile.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/profile/${profile.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border">
                      <AvatarImage src={profile.profile_photo || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                        {profile.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {profile.name || 'Unnamed'}
                        </h3>
                        {profile.is_verified && (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Roles */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.roles.filter(r => ['host', 'cohost', 'staff', 'landowner'].includes(r)).map((role) => (
                          <Badge 
                            key={role} 
                            variant="outline" 
                            className={`text-xs ${roleColors[role] || ''}`}
                          >
                            {roleIcons[role]}
                            <span className="ml-1">{roleLabels[role] || role}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Skills/Expertise/Property Info */}
                  <div className="mt-4">
                    {/* Property info for landowners */}
                    {profile.property_name && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Building className="h-3.5 w-3.5" />
                          {profile.property_name}
                        </div>
                        {profile.property_location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {profile.property_location}
                          </div>
                        )}
                        {profile.property_capacity && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Capacity: {profile.property_capacity} guests
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(profile.expertise_areas?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.expertise_areas?.slice(0, 3).map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {(profile.expertise_areas?.length ?? 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(profile.expertise_areas?.length ?? 0) - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    {(profile.skills?.length ?? 0) > 0 && !profile.expertise_areas?.length && (
                      <div className="flex flex-wrap gap-1">
                        {profile.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(profile.skills?.length ?? 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(profile.skills?.length ?? 0) - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    {profile.service_type && !profile.expertise_areas?.length && !profile.skills?.length && (
                      <Badge variant="secondary" className="text-xs">
                        {profile.service_type}
                      </Badge>
                    )}
                  </div>

                  {/* Rating & Price */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    {/* Rating */}
                    {getRating(profile) ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-medium text-foreground">
                          {getRating(profile)?.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No reviews yet</span>
                    )}

                    {/* Pricing */}
                    {canSeeRates ? (
                      <span className="text-sm font-medium text-foreground">
                        {getPriceDisplay(profile)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-xs">Verify to see rates</span>
                      </div>
                    )}
                  </div>

                  {/* Experience/Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {profile.past_retreats_count ? (
                      <span>{profile.past_retreats_count} retreats hosted</span>
                    ) : null}
                    {profile.past_collaborations_count ? (
                      <span>{profile.past_collaborations_count} collaborations</span>
                    ) : null}
                    {profile.experience_years ? (
                      <span>{profile.experience_years}+ years experience</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount(prev => prev + 12)}
            >
              Load More
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing {visibleCount} of {filteredProfiles?.length ?? 0} members
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
