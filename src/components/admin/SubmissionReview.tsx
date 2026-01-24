import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  MessageSquare, 
  Users, 
  DollarSign,
  MapPin,
  ChefHat,
  Camera,
  User,
  Check,
  X,
  ExternalLink,
  FileText,
  Calculator,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  what_you_offer: string | null;
  what_you_want: string | null;
  looking_for: any;
  sample_itinerary: string | null;
  preferred_dates_flexible: boolean | null;
  retreat_type: string | null;
  price_per_person: number | null;
  max_attendees: number | null;
  created_at: string;
  host_user_id: string;
  host_name?: string;
  host_photo?: string;
  host_email?: string;
}

const needIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  venue: MapPin,
  cohost: Users,
  chef: ChefHat,
  photographer: Camera,
  yoga_instructor: User,
  sound_healer: User,
  massage: User,
  other: User,
};

export default function SubmissionReview() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const handleCalculatePricing = (submission: Submission) => {
    navigate('/admin', { 
      state: { 
        tab: 'builder',
        submission: {
          id: submission.id,
          title: submission.title,
          max_attendees: submission.max_attendees,
          price_per_person: submission.price_per_person,
          looking_for: submission.looking_for,
        }
      }
    });
  };

  const handleExpandSubmission = async (submissionId: string) => {
    const isCurrentlyExpanded = expandedId === submissionId;
    setExpandedId(isCurrentlyExpanded ? null : submissionId);
    
    // Mark notification as read when expanding
    if (!isCurrentlyExpanded) {
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('reference_id', submissionId)
        .eq('read', false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data: retreats, error } = await supabase
        .from('retreats')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch host profiles
      const hostIds = retreats?.map(r => r.host_user_id) || [];
      const uniqueHostIds = [...new Set(hostIds)];

      if (uniqueHostIds.length > 0) {
        const { data: profiles } = await supabase
          .rpc('get_public_profiles', { profile_ids: uniqueHostIds });

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

        // Fetch emails for each host (admin only)
        const emailPromises = uniqueHostIds.map(async (hostId) => {
          const { data: email } = await supabase.rpc('get_profile_email_admin', { profile_id: hostId });
          return [hostId, email] as [string, string];
        });
        const emailResults = await Promise.all(emailPromises);
        const emailMap = new Map(emailResults);

        const submissionsWithHosts = retreats?.map(r => ({
          ...r,
          host_name: (profileMap.get(r.host_user_id) as any)?.name || 'Unknown',
          host_photo: (profileMap.get(r.host_user_id) as any)?.profile_photo,
          host_email: emailMap.get(r.host_user_id) || undefined,
        })) || [];

        setSubmissions(submissionsWithHosts);
      } else {
        setSubmissions(retreats || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: 'draft' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('retreats')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes[submissionId] || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: newStatus === 'draft' ? 'Approved!' : 'Declined',
        description: newStatus === 'draft' 
          ? 'Submission moved to Retreat Builder for matching.' 
          : 'Host will be notified.',
      });

      // Mark notification as read
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('reference_id', submissionId);

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update submission',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading submissions...</div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No pending submissions</h3>
          <p className="text-muted-foreground">All retreat submissions have been reviewed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pending Submissions</h2>
          <p className="text-sm text-muted-foreground">{submissions.length} retreat(s) awaiting review</p>
        </div>
      </div>

      {submissions.map((submission) => {
        const isExpanded = expandedId === submission.id;
        const lookingFor = submission.looking_for as { needs?: string[]; notes?: Record<string, string> } | null;
        const needs = lookingFor?.needs || [];
        const notes = lookingFor?.notes || {};

        return (
          <Card key={submission.id} className={isExpanded ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="cursor-pointer" onClick={() => handleExpandSubmission(submission.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={submission.host_photo || ''} />
                    <AvatarFallback>{submission.host_name?.[0] || 'H'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{submission.title}</CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span>by {submission.host_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(submission.created_at), 'MMM d, yyyy')}
                        </span>
                      </span>
                      {submission.host_email && (
                        <span className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3" />
                          {submission.host_email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  {submission.retreat_type || 'Wellness'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${submission.price_per_person?.toLocaleString() || '?'}/person</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{submission.max_attendees || '?'} attendees</span>
                </div>
              </div>

              {/* Needs Badges */}
              {needs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {needs.map((needId: string) => {
                    const Icon = needIcons[needId] || User;
                    return (
                      <Badge key={needId} variant="outline" className="capitalize">
                        <Icon className="h-3 w-3 mr-1" />
                        {needId.replace(/_/g, ' ')}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t">
                  {submission.what_you_offer && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Vision & Concept</p>
                      <p className="text-foreground">{submission.what_you_offer}</p>
                    </div>
                  )}

                  {submission.what_you_want && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Goals</p>
                      <p className="text-foreground">{submission.what_you_want}</p>
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

                  {submission.sample_itinerary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Sample Itinerary</p>
                      <pre className="text-sm text-foreground bg-accent/50 p-3 rounded-lg whitespace-pre-wrap font-sans">
                        {submission.sample_itinerary}
                      </pre>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Admin Notes</p>
                    <Textarea
                      value={adminNotes[submission.id] || ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [submission.id]: e.target.value })}
                      placeholder="Add internal notes about this submission..."
                      className="text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      onClick={() => handleStatusChange(submission.id, 'draft')}
                      className="flex-1 sm:flex-none"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Start Matching
                    </Button>
                    <Link to={`/messages?to=${submission.host_user_id}`}>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Host
                      </Button>
                    </Link>
                    <Link to={`/profile/${submission.host_user_id}`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="secondary"
                      onClick={() => handleCalculatePricing(submission)}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Pricing
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleStatusChange(submission.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
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