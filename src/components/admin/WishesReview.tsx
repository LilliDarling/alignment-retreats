import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users,
  Mail,
  Globe,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface WishData {
  id: string;
  user_id: string;
  retreat_types: string[];
  desired_experiences: string[];
  description: string | null;
  preferred_timeframe: string | null;
  location_preferences: string[];
  international_ok: boolean;
  budget_min: number | null;
  budget_max: number | null;
  budget_flexibility: string | null;
  group_size: number;
  bringing_others: boolean;
  priority: string | null;
  status: string | null;
  created_at: string;
  // Joined data
  profile_name?: string;
  profile_email?: string;
}

export default function WishesReview() {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchWishes();
  }, []);

  const fetchWishes = async () => {
    try {
      // Fetch wishes
      const { data: wishesData, error: wishesError } = await supabase
        .from('retreat_wishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (wishesError) throw wishesError;

      // Fetch profile info for each wish
      const enrichedWishes = await Promise.all(
        (wishesData || []).map(async (wish) => {
          // Get profile name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', wish.user_id)
            .single();

          // Get email via RPC
          let email = 'Unknown';
          try {
            const { data: emailData } = await supabase.rpc('get_profile_email_admin', {
              profile_id: wish.user_id,
            });
            email = emailData || 'Unknown';
          } catch (e) {
            console.error('Error fetching email:', e);
          }

          return {
            ...wish,
            profile_name: profile?.name || 'Unknown',
            profile_email: email,
          };
        })
      );

      setWishes(enrichedWishes);

      // Mark related notifications as read
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('type', 'attendee_wish')
        .eq('read', false);
    } catch (error) {
      console.error('Error fetching wishes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dream retreat submissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getBudgetFlexibilityColor = (flexibility: string | null) => {
    switch (flexibility) {
      case 'strict':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'moderate':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'flexible':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'price':
        return 'Best Price';
      case 'quality':
        return 'Best Quality';
      case 'location':
        return 'Perfect Location';
      case 'experience':
        return 'Unique Experience';
      case 'balanced':
        return 'Balanced';
      default:
        return 'Not specified';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (wishes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Dream Retreats Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            When attendees submit their dream retreat preferences, they'll appear here for you to match with hosts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Dream Retreat Wishes
          </h2>
          <p className="text-sm text-muted-foreground">
            {wishes.length} attendee{wishes.length !== 1 ? 's' : ''} looking for their perfect retreat
          </p>
        </div>
      </div>

      {wishes.map((wish) => {
        const isExpanded = expandedIds.has(wish.id);

        return (
          <Card key={wish.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    {wish.retreat_types.length > 0 
                      ? wish.retreat_types.join(', ') 
                      : 'Open to anything'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {wish.profile_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {wish.profile_email}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(wish.created_at), 'MMM d, yyyy')}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={wish.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted'}
                  >
                    {wish.status || 'active'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    Budget
                  </div>
                  <div className="font-semibold">
                    ${wish.budget_min?.toLocaleString()} - ${wish.budget_max?.toLocaleString()}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${getBudgetFlexibilityColor(wish.budget_flexibility)}`}
                  >
                    {wish.budget_flexibility || 'moderate'}
                  </Badge>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Timeframe
                  </div>
                  <div className="font-semibold text-sm">
                    {wish.preferred_timeframe || 'Flexible'}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    Group Size
                  </div>
                  <div className="font-semibold">
                    {wish.group_size} {wish.group_size === 1 ? 'person' : 'people'}
                    {wish.bringing_others && <span className="text-xs text-muted-foreground ml-1">(+others)</span>}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Globe className="h-3 w-3" />
                    Location
                  </div>
                  <div className="font-semibold text-sm">
                    {wish.location_preferences.length > 0 
                      ? wish.location_preferences.slice(0, 2).join(', ')
                      : 'Any location'}
                    {wish.international_ok && <Badge variant="outline" className="ml-1 text-xs">International OK</Badge>}
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => toggleExpanded(wish.id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More Details
                  </>
                )}
              </Button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-4 pt-2 border-t border-border">
                  {/* Location Preferences */}
                  {wish.location_preferences.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Location Preferences
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {wish.location_preferences.map((loc) => (
                          <Badge key={loc} variant="outline">{loc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desired Experiences */}
                  {wish.desired_experiences.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        Desired Experiences
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {wish.desired_experiences.map((exp) => (
                          <Badge key={exp} variant="secondary">{exp}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {wish.description && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Their Vision
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        {wish.description}
                      </p>
                    </div>
                  )}

                  {/* Priority */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Priority</h4>
                    <Badge variant="outline" className="bg-primary/5 text-primary">
                      {getPriorityLabel(wish.priority)}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.location.href = `mailto:${wish.profile_email}?subject=Your Dream Retreat&body=Hi ${wish.profile_name},%0D%0A%0D%0AThank you for sharing your retreat vision with us!`;
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Contact Attendee
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
