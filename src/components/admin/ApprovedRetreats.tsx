import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  MapPin,
  Users,
  Briefcase,
  Handshake,
  ChefHat,
  Check,
  Clock,
  DollarSign,
  Loader2,
  Send,
  X,
  MessageSquare,
  ExternalLink,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';
import { toast } from 'sonner';

interface LookingFor {
  needs?: string[];
  notes?: Record<string, string>;
  staffDayRate?: number;
  chefDayRate?: number;
  cohostFeePerPerson?: number;
  venueBudgetPerPersonPerNight?: number;
}

interface TeamMember {
  id: string;
  role: string;
  agreed: boolean;
  user_id: string;
  profiles: { name: string | null } | null;
}

interface ApprovedRetreatRaw {
  id: string;
  title: string;
  description: string | null;
  retreat_type: string | null;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number | null;
  location: string | null;
  host_user_id: string;
  looking_for: LookingFor | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string | null;
  price_per_person: number | null;
  what_you_offer: string | null;
  what_you_want: string | null;
  sample_itinerary: string | null;
}

interface ApprovedRetreat extends ApprovedRetreatRaw {
  host_name: string | null;
  reviewer_name: string | null;
}

const needIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cohost: Handshake,
  venue: MapPin,
  chef: ChefHat,
  staff: Briefcase,
  photographer: User,
  yoga_instructor: User,
  sound_healer: User,
  massage: User,
  other: User,
};

const needLabels: Record<string, string> = {
  cohost: 'Co-Host',
  venue: 'Venue',
  chef: 'Chef',
  staff: 'Staff',
};

export default function ApprovedRetreats() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState<string | null>(null);

  const { data: retreats = [], isLoading } = useQuery({
    queryKey: ['admin-approved-retreats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select('id, title, description, retreat_type, start_date, end_date, max_attendees, location, host_user_id, looking_for, reviewed_at, reviewed_by, created_at, price_per_person, what_you_offer, what_you_want, sample_itinerary')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const raw = (data || []) as unknown as ApprovedRetreatRaw[];

      // Collect all user IDs we need to resolve (hosts + reviewers)
      const userIds = new Set<string>();
      raw.forEach(r => {
        userIds.add(r.host_user_id);
        if (r.reviewed_by) userIds.add(r.reviewed_by);
      });

      // Fetch profiles in one call
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { profile_ids: [...userIds] });
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return raw.map(r => ({
        ...r,
        host_name: (profileMap.get(r.host_user_id) as any)?.name || null,
        reviewer_name: r.reviewed_by ? (profileMap.get(r.reviewed_by) as any)?.name || null : null,
      })) as ApprovedRetreat[];
    },
  });

  // Fetch team members for all approved retreats
  const retreatIds = retreats.map(r => r.id);
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['admin-retreat-teams', retreatIds],
    enabled: retreatIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreat_team')
        .select('id, retreat_id, role, agreed, user_id')
        .in('retreat_id', retreatIds);

      if (error) throw error;
      const raw = data || [];

      // Resolve team member names
      const memberIds = [...new Set(raw.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { profile_ids: memberIds });
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return raw.map(t => ({
        ...t,
        profiles: profileMap.get(t.user_id) ? { name: (profileMap.get(t.user_id) as any).name } : null,
      })) as (TeamMember & { retreat_id: string })[];
    },
  });

  const getTeamForRetreat = (retreatId: string) =>
    teamMembers.filter(t => t.retreat_id === retreatId);

  const publishMutation = useMutation({
    mutationFn: async (retreatId: string) => {
      const { error } = await supabase
        .from('retreats')
        .update({ status: 'published' })
        .eq('id', retreatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-approved-retreats'] });
      toast.success('Retreat published!', {
        description: 'The retreat is now visible on the public browse page.',
      });
      setPublishConfirm(null);
    },
    onError: (error) => {
      console.error('Error publishing retreat:', error);
      toast.error('Failed to publish retreat');
    },
  });

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return 'Dates TBD';
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return 'Dates TBD';
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading approved retreats...</div>
      </div>
    );
  }

  if (retreats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No approved retreats</h3>
          <p className="text-muted-foreground">Approved retreats waiting for team assembly will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Matching</h2>
          <p className="text-sm text-muted-foreground">{retreats.length} retreat(s) in matching phase</p>
        </div>
      </div>

      {retreats.map((retreat) => {
        const isExpanded = expandedId === retreat.id;
        const lookingFor = (retreat.looking_for || {}) as LookingFor;
        const needs = lookingFor.needs || [];
        const notes = lookingFor.notes || {};
        const team = getTeamForRetreat(retreat.id);
        const reviewerName = retreat.reviewer_name;

        return (
          <Card key={retreat.id} className={isExpanded ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : retreat.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{retreat.host_name?.[0] || 'H'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{retreat.title}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span>by {retreat.host_name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {retreat.created_at && format(new Date(retreat.created_at), 'MMM d, yyyy')}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Check className="h-3 w-3 text-green-600" />
                        Approved{retreat.reviewed_at && ` ${format(new Date(retreat.reviewed_at), 'MMM d, yyyy')}`}
                        {reviewerName && ` by ${reviewerName}`}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  {retreat.retreat_type || 'Wellness'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${retreat.price_per_person?.toLocaleString() || '?'}/person</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{retreat.max_attendees || '?'} attendees</span>
                </div>
                {retreat.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{retreat.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateRange(retreat.start_date, retreat.end_date)}</span>
                </div>
              </div>

              {/* Needs Badges */}
              {needs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {needs.map((needId: string) => {
                    const Icon = needIcons[needId] || User;
                    const applicants = team.filter(t => t.role === needId);
                    const accepted = applicants.filter(t => t.agreed);

                    return (
                      <Badge
                        key={needId}
                        variant={accepted.length > 0 ? 'default' : 'outline'}
                        className="capitalize gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {needId.replace(/_/g, ' ')}
                        {accepted.length > 0 && <Check className="h-3 w-3" />}
                        {applicants.length > 0 && accepted.length === 0 && (
                          <span className="text-xs">({applicants.length})</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t">
                  {retreat.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground">{retreat.description}</p>
                    </div>
                  )}

                  {retreat.what_you_offer && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Vision & Concept</p>
                      <p className="text-foreground">{retreat.what_you_offer}</p>
                    </div>
                  )}

                  {retreat.what_you_want && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Goals</p>
                      <p className="text-foreground">{retreat.what_you_want}</p>
                    </div>
                  )}

                  {/* Needs Details */}
                  {needs.length > 0 && Object.keys(notes).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Specific Requirements</p>
                      <div className="space-y-2">
                        {needs.map((needId: string) => notes[needId] && (
                          <div key={needId} className="bg-accent/50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground capitalize">{needId.replace(/_/g, ' ')}</p>
                            <p className="text-sm">{notes[needId]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {retreat.sample_itinerary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Sample Itinerary</p>
                      <pre className="text-sm text-foreground bg-accent/50 p-3 rounded-lg whitespace-pre-wrap font-sans">
                        {retreat.sample_itinerary}
                      </pre>
                    </div>
                  )}

                  {/* Position Status */}
                  {needs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Position Status</p>
                      <div className="space-y-2">
                        {needs.map(need => {
                          const Icon = needIcons[need] || Briefcase;
                          const applicants = team.filter(t => t.role === need);
                          const accepted = applicants.filter(t => t.agreed);
                          const pending = applicants.filter(t => !t.agreed);

                          return (
                            <div
                              key={need}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <span className="text-sm font-medium">{needLabels[need] || need}</span>
                                  {applicants.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {applicants.map(a => (a.profiles as any)?.name || 'Unknown').join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {accepted.length > 0 && (
                                  <Badge variant="default" className="gap-1">
                                    <Check className="h-3 w-3" />
                                    {accepted.length} accepted
                                  </Badge>
                                )}
                                {pending.length > 0 && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {pending.length} pending
                                  </Badge>
                                )}
                                {applicants.length === 0 && (
                                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                                    <X className="h-3 w-3" />
                                    No applicants
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={() => setPublishConfirm(retreat.id)}>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Retreat
                    </Button>
                    <Link to={`/messages?to=${retreat.host_user_id}`}>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Host
                      </Button>
                    </Link>
                    <Link to={`/profile/${retreat.host_user_id}`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Publish confirmation dialog */}
      <AlertDialog open={!!publishConfirm} onOpenChange={(open) => { if (!open) setPublishConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this retreat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the retreat visible on the public browse page. You can publish even if not all team positions are filled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => publishConfirm && publishMutation.mutate(publishConfirm)}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
