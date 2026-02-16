import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { SEO } from '@/components/SEO';
import { ApplyToRetreatDialog } from '@/components/ApplyToRetreatDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Handshake,
  Home,
  ChefHat,
  Check,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';

interface LookingFor {
  needs?: string[];
  staffDayRate?: number;
  chefDayRate?: number;
  cohostFeePerPerson?: number;
  cohostFeeType?: string;
  cohostPercentage?: number;
  venueBudgetPerPersonPerNight?: number;
  nights?: number;
}

interface ApprovedRetreat {
  id: string;
  title: string;
  description: string | null;
  retreat_type: string | null;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number | null;
  location: string | null;
  host_name: string | null;
  looking_for: LookingFor | null;
}

const needIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cohost: Handshake,
  venue: Home,
  chef: ChefHat,
  staff: Briefcase,
};

const needLabels: Record<string, string> = {
  cohost: 'Co-Host',
  venue: 'Venue',
  chef: 'Chef',
  staff: 'Staff',
};

function getRoleBudgetLabel(role: string, lookingFor: LookingFor): string | null {
  switch (role) {
    case 'cohost':
      return lookingFor.cohostFeePerPerson
        ? `$${lookingFor.cohostFeePerPerson}/person`
        : null;
    case 'venue':
      return lookingFor.venueBudgetPerPersonPerNight
        ? `$${lookingFor.venueBudgetPerPersonPerNight}/person/night`
        : null;
    case 'chef':
      return lookingFor.chefDayRate
        ? `$${lookingFor.chefDayRate}/night`
        : null;
    case 'staff':
      return lookingFor.staffDayRate
        ? `$${lookingFor.staffDayRate}/night`
        : null;
    default:
      return null;
  }
}

const PAGE_SIZE = 12;

export default function BrowseOpportunities() {
  usePageTitle('Opportunities');
  const { user } = useAuth();
  const [applyDialog, setApplyDialog] = useState<{
    open: boolean;
    retreatId: string;
    retreatTitle: string;
    lookingFor: LookingFor;
  }>({ open: false, retreatId: '', retreatTitle: '', lookingFor: {} });

  // Fetch approved retreats with pagination
  const {
    data,
    isLoading,
    refetch: refetchRetreats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['approved-retreats'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('retreats')
        .select('id, title, description, retreat_type, start_date, end_date, max_attendees, location, host_name, looking_for')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data || []) as unknown as ApprovedRetreat[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });

  const retreats = data?.pages.flat() ?? [];

  // Fetch user's existing applications
  const { data: myApplications = [], refetch: refetchApplications } = useQuery({
    queryKey: ['my-applications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreat_team')
        .select('retreat_id, role, agreed')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data || [];
    },
  });

  const getApplicationsForRetreat = (retreatId: string) =>
    myApplications.filter(a => a.retreat_id === retreatId);

  const hasAppliedForRole = (retreatId: string, role: string) =>
    myApplications.some(a => a.retreat_id === retreatId && a.role === role);

  const handleApplied = () => {
    refetchApplications();
    refetchRetreats();
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'Dates TBD';
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 'Dates TBD';
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Opportunities"
        description="Browse approved retreats looking for team members. Apply to collaborate as a co-host, venue provider, chef, or staff."
        noindex
      />
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            Opportunities
          </h1>
          <p className="text-muted-foreground">
            Browse approved retreats looking for team members. Apply to collaborate as a co-host, venue, chef, or staff.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {retreats.length} opportunity{retreats.length !== 1 ? 'ies' : 'y'} available
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : retreats.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 rounded-full bg-accent/10 mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                No opportunities yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Check back soon — new retreats are approved regularly.
              </p>
              <Link to="/retreats/browse">
                <Button variant="outline">Browse Published Retreats</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
          <div className="space-y-4">
            {retreats.map((retreat) => {
              const lookingFor = (retreat.looking_for || {}) as LookingFor;
              const needs = lookingFor.needs || [];
              const applications = getApplicationsForRetreat(retreat.id);
              const allRolesApplied = needs.length > 0 && needs.every(n => hasAppliedForRole(retreat.id, n));

              return (
                <Card key={retreat.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Retreat Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-display text-xl font-semibold text-foreground">
                              {retreat.title}
                            </h2>
                            {retreat.host_name && (
                              <p className="text-sm text-muted-foreground">by {retreat.host_name}</p>
                            )}
                          </div>
                          {retreat.retreat_type && (
                            <Badge variant="secondary">{retreat.retreat_type}</Badge>
                          )}
                        </div>

                        {retreat.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {retreat.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {retreat.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {retreat.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateRange(retreat.start_date, retreat.end_date)}
                          </span>
                          {retreat.max_attendees && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {retreat.max_attendees} attendees
                            </span>
                          )}
                        </div>

                        {/* Needed Roles */}
                        {needs.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Looking for:</p>
                            <div className="flex flex-wrap gap-2">
                              {needs.map(need => {
                                const Icon = needIcons[need] || Briefcase;
                                const budget = getRoleBudgetLabel(need, lookingFor);
                                const applied = hasAppliedForRole(retreat.id, need);
                                const app = applications.find(a => a.role === need);

                                return (
                                  <Badge
                                    key={need}
                                    variant={applied ? 'default' : 'outline'}
                                    className="gap-1.5 py-1 px-3"
                                  >
                                    {applied ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Icon className="h-3 w-3" />
                                    )}
                                    {needLabels[need] || need}
                                    {budget && (
                                      <span className="text-xs opacity-75">
                                        <DollarSign className="h-3 w-3 inline" />
                                        {budget.replace('$', '')}
                                      </span>
                                    )}
                                    {applied && (
                                      <span className="text-xs">
                                        {app?.agreed ? '(Accepted)' : '(Applied)'}
                                      </span>
                                    )}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Apply Button */}
                      <div className="flex flex-col justify-center">
                        {allRolesApplied ? (
                          <Button variant="outline" disabled className="whitespace-nowrap">
                            <Check className="h-4 w-4 mr-2" />
                            Applied
                          </Button>
                        ) : (
                          <Button
                            className="whitespace-nowrap"
                            onClick={() => setApplyDialog({
                              open: true,
                              retreatId: retreat.id,
                              retreatTitle: retreat.title,
                              lookingFor,
                            })}
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
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

      <ApplyToRetreatDialog
        open={applyDialog.open}
        onOpenChange={(open) => setApplyDialog(prev => ({ ...prev, open }))}
        retreatId={applyDialog.retreatId}
        retreatTitle={applyDialog.retreatTitle}
        lookingFor={applyDialog.lookingFor}
        onApplied={handleApplied}
      />
    </div>
  );
}
