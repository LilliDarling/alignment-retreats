import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { HostOnboarding } from '@/components/onboarding/HostOnboarding';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Image,
  Users,
  Check,
  X
} from 'lucide-react';

interface HostRetreat {
  id: string;
  title: string;
  status: string;
  retreat_type: string | null;
  start_date: string | null;
  end_date: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  main_image: string | null;
  created_at: string;
  description: string | null;
  what_you_offer: string | null;
  sample_itinerary: string | null;
  looking_for: any;
  preferred_dates_flexible: boolean | null;
  custom_venue_name: string | null;
}

interface HostProfile {
  expertise_areas: string[] | null;
  min_rate: number | null;
  max_rate: number | null;
  verified: boolean | null;
  available_from: string | null;
  available_to: string | null;
  portfolio_links: string | null;
  has_marketing_material: boolean | null;
  marketing_description: string | null;
  preferred_climates: string[] | null;
  preferred_regions: string | null;
}

interface TeamApplication {
  id: string;
  role: string;
  fee_amount: number;
  fee_type: string;
  description: string | null;
  user_id: string;
  retreat_id: string;
  retreat_title: string;
  applicant_name: string | null;
  applicant_photo: string | null;
}

const roleLabels: Record<string, string> = {
  host: 'Host',
  cohost: 'Co-Host',
  venue: 'Venue',
  chef: 'Chef',
  staff: 'Staff',
  other: 'Other',
};

function feeLabel(feeType: string): string {
  switch (feeType) {
    case 'per_person': return '/person';
    case 'per_night': return '/night';
    case 'per_person_per_night': return '/person/night';
    case 'flat': return ' flat';
    case 'percentage': return '%';
    default: return '';
  }
}

interface HostTabProps {
  profile: {
    name: string | null;
    onboarding_completed: { host?: boolean; [key: string]: boolean | undefined } | null;
    is_coop_member?: boolean;
  };
  onProfileUpdate: (onboarding: Record<string, boolean | undefined>) => void;
}

export default function HostTab({ profile, onProfileUpdate }: HostTabProps) {
  const { user } = useAuth();
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<TeamApplication[]>([]);
  const [myRetreats, setMyRetreats] = useState<HostRetreat[]>([]);
  const [expandedRetreatId, setExpandedRetreatId] = useState<string | null>(null);

  const fetchApplications = async () => {
    if (!user) return;

    // Get host's retreats, then find pending team applications
    const { data: myRetreats } = await supabase
      .from('retreats')
      .select('id, title')
      .eq('host_user_id', user.id);

    if (!myRetreats || myRetreats.length === 0) {
      setPendingApplications([]);
      return;
    }

    const retreatIds = myRetreats.map(r => r.id);
    const retreatMap = new Map(myRetreats.map(r => [r.id, r.title]));

    const { data: applications } = await supabase
      .from('retreat_team')
      .select('id, role, fee_amount, fee_type, description, user_id, retreat_id')
      .in('retreat_id', retreatIds)
      .eq('agreed', false);

    if (!applications || applications.length === 0) {
      setPendingApplications([]);
      return;
    }

    // Fetch applicant profiles
    const userIds = [...new Set(applications.map(a => a.user_id))];
    const { data: profiles } = await supabase
      .rpc('get_public_profiles', { profile_ids: userIds });

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; name: string | null; profile_photo: string | null }) => [p.id, p])
    );

    setPendingApplications(applications.map(a => ({
      ...a,
      retreat_title: retreatMap.get(a.retreat_id) || 'Retreat',
      applicant_name: (profileMap.get(a.user_id) as { name: string | null } | undefined)?.name || null,
      applicant_photo: (profileMap.get(a.user_id) as { profile_photo: string | null } | undefined)?.profile_photo || null,
    })));
  };

  useEffect(() => {
    const fetchHostData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: hostData } = await supabase
        .from('hosts')
        .select('expertise_areas, min_rate, max_rate, verified, available_from, available_to, portfolio_links, has_marketing_material, marketing_description, preferred_climates, preferred_regions')
        .eq('user_id', user.id)
        .single();

      if (hostData) {
        setHostProfile(hostData);
      }

      // Fetch user's submitted retreats
      const { data: retreatsData } = await supabase
        .from('retreats')
        .select('id, title, status, retreat_type, start_date, end_date, max_attendees, price_per_person, main_image, created_at, description, what_you_offer, sample_itinerary, looking_for, preferred_dates_flexible, custom_venue_name')
        .eq('host_user_id', user.id)
        .order('created_at', { ascending: false });

      if (retreatsData) {
        setMyRetreats(retreatsData as HostRetreat[]);
      }

      // Auto-trigger onboarding if host hasn't completed their profile
      if (profile.onboarding_completed?.host !== true) {
        setShowOnboarding(true);
      }

      await fetchApplications();
      setLoading(false);
    };

    fetchHostData();
  }, [user, profile.onboarding_completed?.host]);

  const handleAcceptApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from('retreat_team')
      .update({ agreed: true, agreed_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to accept application.');
      return;
    }
    toast.success('Application accepted!');
    fetchApplications();
  };

  const handleDeclineApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from('retreat_team')
      .delete()
      .eq('id', applicationId);

    if (error) {
      toast.error('Failed to decline application.');
      return;
    }
    toast.success('Application declined.');
    fetchApplications();
  };

  const handleOnboardingComplete = async (data: {
    expertiseAreas: string[];
    minRate: number;
    maxRate: number;
    availableFrom: Date | undefined;
    availableTo: Date | undefined;
    portfolioLinks: string;
    hasMarketingMaterial: boolean;
    marketingDescription: string;
    preferredClimates: string[];
    preferredRegions: string;
  }) => {
    if (!user) return;

    try {
      const hostPayload = {
        expertise_areas: data.expertiseAreas,
        min_rate: data.minRate,
        max_rate: data.maxRate,
        available_from: data.availableFrom ? data.availableFrom.toISOString().split('T')[0] : null,
        available_to: data.availableTo ? data.availableTo.toISOString().split('T')[0] : null,
        portfolio_links: data.portfolioLinks || null,
        has_marketing_material: data.hasMarketingMaterial,
        marketing_description: data.marketingDescription || null,
        preferred_climates: data.preferredClimates,
        preferred_regions: data.preferredRegions || null,
      };

      const { error: hostError } = await supabase
        .from('hosts')
        .upsert({ user_id: user.id, ...hostPayload }, { onConflict: 'user_id' });

      if (hostError) throw hostError;

      const currentOnboarding = profile.onboarding_completed || {};
      const updatedOnboarding = { ...currentOnboarding, host: true };
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: updatedOnboarding })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setHostProfile({
        expertise_areas: data.expertiseAreas,
        min_rate: data.minRate,
        max_rate: data.maxRate,
        verified: hostProfile?.verified || null,
        available_from: data.availableFrom ? data.availableFrom.toISOString().split('T')[0] : null,
        available_to: data.availableTo ? data.availableTo.toISOString().split('T')[0] : null,
        portfolio_links: data.portfolioLinks || null,
        has_marketing_material: data.hasMarketingMaterial,
        marketing_description: data.marketingDescription || null,
        preferred_climates: data.preferredClimates,
        preferred_regions: data.preferredRegions || null,
      });
      onProfileUpdate(updatedOnboarding);
      setShowOnboarding(false);
      toast.success('Host profile completed!');

      // Send admin notification
      const userEmail = await supabase.rpc('get_auth_email');
      const completedFields = [
        `Expertise Areas: ${data.expertiseAreas.join(', ')}`,
        `Rate Range: ${data.minRate} - ${data.maxRate} per person`,
      ];
      if (data.availableFrom && data.availableTo) {
        completedFields.push(`Availability: ${format(data.availableFrom, 'MMM d, yyyy')} - ${format(data.availableTo, 'MMM d, yyyy')}`);
      }
      if (data.portfolioLinks) {
        completedFields.push(`Portfolio Links: ${data.portfolioLinks.split('\n').length} link(s) provided`);
      }
      if (data.hasMarketingMaterial) {
        completedFields.push(`Has Marketing Material: Yes${data.marketingDescription ? ` - ${data.marketingDescription.substring(0, 50)}...` : ''}`);
      }
      if (data.preferredClimates.length > 0) {
        completedFields.push(`Preferred Climates: ${data.preferredClimates.join(', ')}`);
      }
      if (data.preferredRegions) {
        completedFields.push(`Preferred Regions: ${data.preferredRegions}`);
      }

      supabase.functions.invoke('notify-profile-completed', {
        body: {
          name: profile.name || 'Host',
          email: userEmail.data || '',
          roles: ['host'],
          completedFields
        }
      }).catch(() => { /* notification is best-effort */ });
    } catch (error) {
      console.error('Error saving host profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const formatDateRange = () => {
    if (!hostProfile?.available_from || !hostProfile?.available_to) return null;
    try {
      const from = new Date(hostProfile.available_from);
      const to = new Date(hostProfile.available_to);
      return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
    } catch {
      return null;
    }
  };

  const isOnboardingCompleted = profile.onboarding_completed?.host === true;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading host profile...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="max-w-4xl mx-auto">
        <HostOnboarding
          onComplete={handleOnboardingComplete}
          onBack={() => setShowOnboarding(false)}
          initialData={{
            expertiseAreas: hostProfile?.expertise_areas || [],
            minRate: hostProfile?.min_rate || 500,
            maxRate: hostProfile?.max_rate || 2000,
            availableFrom: hostProfile?.available_from ? new Date(hostProfile.available_from) : undefined,
            availableTo: hostProfile?.available_to ? new Date(hostProfile.available_to) : undefined,
            portfolioLinks: hostProfile?.portfolio_links || '',
            hasMarketingMaterial: hostProfile?.has_marketing_material || false,
            marketingDescription: hostProfile?.marketing_description || '',
            preferredClimates: hostProfile?.preferred_climates || [],
            preferredRegions: hostProfile?.preferred_regions || '',
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Host Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl">Your Host Profile</CardTitle>
              <CardDescription>
                {isOnboardingCompleted
                  ? 'Your current profile settings'
                  : 'Set up your profile to get discovered by collaborators and venues'}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowOnboarding(true)}
              variant="outline"
              size="sm"
            >
              {isOnboardingCompleted ? 'Edit Profile' : 'Complete Profile'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        {isOnboardingCompleted && hostProfile && (
          <CardContent className="space-y-6">
            {hostProfile.expertise_areas && hostProfile.expertise_areas.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {hostProfile.expertise_areas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hostProfile.min_rate && hostProfile.max_rate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Rate Range (per person)
                  </h3>
                  <span className="text-lg font-semibold text-foreground">
                    ${hostProfile.min_rate.toLocaleString()} - ${hostProfile.max_rate.toLocaleString()}
                  </span>
                </div>
              )}

              {formatDateRange() && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Availability
                  </h3>
                  <span className="text-foreground">{formatDateRange()}</span>
                </div>
              )}

              {(hostProfile.preferred_climates?.length || hostProfile.preferred_regions) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Preferences
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {hostProfile.preferred_climates?.map((climate) => (
                      <Badge key={climate} variant="outline" className="text-xs">
                        {climate}
                      </Badge>
                    ))}
                  </div>
                  {hostProfile.preferred_regions && (
                    <p className="text-sm text-foreground mt-1">{hostProfile.preferred_regions}</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Marketing Material
                </h3>
                <span className="text-foreground">
                  {hostProfile.has_marketing_material ? 'Yes - Assets ready' : 'Not yet'}
                </span>
              </div>
            </div>

            {hostProfile.portfolio_links && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Portfolio & Links
                </h3>
                <p className="text-sm text-foreground whitespace-pre-line">{hostProfile.portfolio_links}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Co-Op CTA — hidden for existing co-op members */}
      {!profile.is_coop_member && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Own a Piece of the Platform
                </h2>
                <p className="text-muted-foreground">
                  Join our member-owned cooperative and keep more of what you earn
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/cooperative">
                Become a Co-Owner Today!
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Submit Retreat CTA */}
      <Card className="bg-gradient-to-r from-accent/10 to-transparent border border-border shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Submit a Retreat</h2>
            <p className="text-muted-foreground">Have a retreat idea? Submit it for review and start building your team.</p>
          </div>
          <Button size="lg" className="whitespace-nowrap" asChild>
            <Link to="/retreats/submit">
              <Sparkles className="h-5 w-5 mr-2" />
              Submit Retreat
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* My Submitted Retreats */}
      {myRetreats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">My Retreats</CardTitle>
            <CardDescription>Track the status of your retreat submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRetreats.map((retreat) => {
                const isExpanded = expandedRetreatId === retreat.id;
                const isPublished = retreat.status === 'published';
                const lookingFor = retreat.looking_for as { needs?: string[]; notes?: Record<string, string> } | null;
                const needs = lookingFor?.needs || [];

                const header = (
                  <div className="flex items-center gap-4">
                    {retreat.main_image ? (
                      <img src={retreat.main_image} alt={retreat.title} className="w-16 h-12 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Image className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{retreat.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {retreat.retreat_type || 'Wellness'}
                        {retreat.start_date && ` · ${format(new Date(retreat.start_date), 'MMM d, yyyy')}`}
                        {retreat.max_attendees && ` · ${retreat.max_attendees} attendees`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        retreat.status === 'published' ? 'default' :
                        retreat.status === 'approved' ? 'default' :
                        retreat.status === 'pending_review' ? 'secondary' :
                        retreat.status === 'cancelled' ? 'destructive' :
                        'outline'
                      }
                      className="flex-shrink-0"
                    >
                      {retreat.status === 'pending_review' ? 'Under Review' :
                       retreat.status === 'approved' ? 'Approved' :
                       retreat.status === 'published' ? 'Published' :
                       retreat.status === 'cancelled' ? 'Declined' :
                       retreat.status}
                    </Badge>
                  </div>
                );

                if (isPublished) {
                  return (
                    <Link
                      key={retreat.id}
                      to={`/retreats/${retreat.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      {header}
                    </Link>
                  );
                }

                return (
                  <div
                    key={retreat.id}
                    className={`rounded-lg border transition-colors ${isExpanded ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setExpandedRetreatId(isExpanded ? null : retreat.id)}
                    >
                      {header}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-4 border-t pt-4">
                        {retreat.main_image && (
                          <img src={retreat.main_image} alt="Cover" className="w-full max-w-md h-48 rounded-lg object-cover" />
                        )}

                        {retreat.what_you_offer && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Vision & Concept</p>
                            <p className="text-foreground text-sm">{retreat.what_you_offer}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground font-medium">Price per Person</p>
                            <p className="text-foreground">${retreat.price_per_person?.toLocaleString() || '?'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">Attendees</p>
                            <p className="text-foreground">{retreat.max_attendees || '?'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">Dates</p>
                            <p className="text-foreground">
                              {retreat.start_date && retreat.end_date
                                ? `${format(new Date(retreat.start_date), 'MMM d')} - ${format(new Date(retreat.end_date), 'MMM d, yyyy')}`
                                : 'Not set'}
                              {retreat.preferred_dates_flexible && ' (flexible)'}
                            </p>
                          </div>
                          {retreat.custom_venue_name && (
                            <div>
                              <p className="text-muted-foreground font-medium">Venue</p>
                              <p className="text-foreground">{retreat.custom_venue_name}</p>
                            </div>
                          )}
                        </div>

                        {needs.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Looking For</p>
                            <div className="flex flex-wrap gap-2">
                              {needs.map((needId: string) => (
                                <Badge key={needId} variant="outline" className="capitalize text-xs">
                                  {needId.replace(/_/g, ' ')}
                                </Badge>
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

                        <p className="text-xs text-muted-foreground">
                          Submitted {format(new Date(retreat.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Applications */}
      {pendingApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Applications
            </CardTitle>
            <CardDescription>
              {pendingApplications.length} pending application{pendingApplications.length !== 1 ? 's' : ''} for your retreats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(app.applicant_name || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {app.applicant_name || 'Unknown'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {roleLabels[app.role] || app.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{app.retreat_title}</span>
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {app.fee_amount}{feeLabel(app.fee_type)}
                        </span>
                      </div>
                      {app.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {app.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptApplication(app.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineApplication(app.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
