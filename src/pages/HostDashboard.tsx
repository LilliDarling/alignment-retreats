import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { HostOnboarding } from '@/components/onboarding/HostOnboarding';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Image
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

interface Profile {
  name: string | null;
  onboarding_completed: { host?: boolean; [key: string]: boolean | undefined } | null;
  is_coop_member: boolean;
}

export default function HostDashboard() {
  const { user, userRoles } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [myRetreats, setMyRetreats] = useState<HostRetreat[]>([]);
  const hasMultipleRoles = userRoles.length > 1;

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Fetch is_coop_member separately (not yet in generated types)
        const { data: coopData } = await supabase
          .from('profiles')
          .select('is_coop_member' as any)
          .eq('id', user.id)
          .single();

        setProfile({
          name: profileData.name,
          onboarding_completed: profileData.onboarding_completed as Profile['onboarding_completed'],
          is_coop_member: (coopData as any)?.is_coop_member ?? false,
        });
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
        .select('id, title, status, retreat_type, start_date, end_date, max_attendees, price_per_person, main_image, created_at')
        .eq('host_user_id', user.id)
        .order('created_at', { ascending: false });

      if (retreatsData) {
        setMyRetreats(retreatsData as HostRetreat[]);
      }

      // Auto-trigger onboarding if host hasn't completed their profile
      const onboarding = profileData?.onboarding_completed as Profile['onboarding_completed'];
      if (onboarding?.host !== true) {
        setShowOnboarding(true);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

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
      // Update hosts table with all new fields
      const { error: hostError } = await supabase
        .from('hosts')
        .update({
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
        })
        .eq('user_id', user.id);

      if (hostError) throw hostError;

      // Update onboarding_completed in profiles
      const currentOnboarding = profile?.onboarding_completed || {};
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: { ...currentOnboarding, host: true }
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
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
      setProfile({
        ...profile,
        name: profile?.name || null,
        onboarding_completed: { ...currentOnboarding, host: true }
      });
      setShowOnboarding(false);
      toast.success('Host profile completed!');

      // Send admin notification about profile completion
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
          name: profile?.name || 'Host',
          email: userEmail.data || '',
          roles: ['host'],
          completedFields
        }
      }).then(({ error }) => {
        if (error) console.error('Profile completion notification failed:', error);
        else console.log('Profile completion notification sent');
      });
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

  const isOnboardingCompleted = profile?.onboarding_completed?.host === true;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {hasMultipleRoles && (
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Welcome, {profile?.name || 'Host'}!
            </h1>
          </div>
          <p className="text-muted-foreground">
            Lead transformative retreat experiences and connect with your ideal team.
          </p>
        </div>

        {/* Complete Profile CTA */}
        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {isOnboardingCompleted ? (
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {isOnboardingCompleted ? 'Your Host Profile' : 'Complete Your Host Profile'}
                </h2>
                <p className="text-muted-foreground">
                  {isOnboardingCompleted
                    ? 'Update your expertise and preferences anytime'
                    : 'Set up your profile to get discovered by collaborators and venues'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowOnboarding(true)}
              variant={isOnboardingCompleted ? 'outline' : 'default'}
            >
              {isOnboardingCompleted ? 'Update Profile' : 'Complete Profile'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Co-Op CTA — hidden for existing co-op members */}
        {!profile?.is_coop_member && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
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

        {/* My Submitted Retreats */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">My Retreats</CardTitle>
                <CardDescription>Track the status of your retreat submissions</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/submit-retreat">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit New
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myRetreats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">You haven't submitted any retreats yet.</p>
                <Button asChild variant="outline">
                  <Link to="/submit-retreat">Submit Your First Retreat</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRetreats.map((retreat) => (
                  <Link
                    key={retreat.id}
                    to={`/retreats/${retreat.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
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
                        {retreat.start_date && ` • ${format(new Date(retreat.start_date), 'MMM d, yyyy')}`}
                        {retreat.max_attendees && ` • ${retreat.max_attendees} attendees`}
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
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Summary (only show if completed) */}
        {isOnboardingCompleted && hostProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Your Host Profile</CardTitle>
              <CardDescription>Your current profile settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expertise Areas */}
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
                {/* Rate Range */}
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

                {/* Availability */}
                {formatDateRange() && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Availability
                    </h3>
                    <span className="text-foreground">{formatDateRange()}</span>
                  </div>
                )}

                {/* Location Preferences */}
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

                {/* Marketing Material */}
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

              {/* Portfolio Links */}
              {hostProfile.portfolio_links && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Portfolio & Links
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-line">{hostProfile.portfolio_links}</p>
                </div>
              )}

              {/* Verified Status */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  {hostProfile.verified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-success font-medium">Verified Host</span>
                    </>
                  ) : (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                      <span className="text-muted-foreground">Verification pending</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
