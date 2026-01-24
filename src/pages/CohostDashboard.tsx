import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { CohostOnboarding } from '@/components/onboarding/CohostOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  Handshake,
  Calendar,
  Star,
  Search,
  CheckCircle,
  DollarSign,
  MapPin
} from 'lucide-react';

interface CohostProfile {
  skills: string[] | null;
  daily_rate: number | null;
  min_rate: number | null;
  max_rate: number | null;
  available_from: string | null;
  available_to: string | null;
  preferred_climates: string[] | null;
  preferred_regions: string | null;
}

export default function CohostDashboard() {
  const { user, userRoles } = useAuth();
  const hasMultipleRoles = userRoles.length > 1;
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cohostProfile, setCohostProfile] = useState<CohostProfile | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCohostData();
    }
  }, [user]);

  const loadCohostData = async () => {
    if (!user) return;
    
    try {
      // Load cohost profile with new fields
      const { data: cohostData } = await supabase
        .from('cohosts')
        .select('skills, daily_rate, min_rate, max_rate, available_from, available_to, preferred_climates, preferred_regions')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (cohostData) {
        setCohostProfile(cohostData);
      }

      // Check if onboarding was completed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData?.onboarding_completed) {
        const completed = typeof profileData.onboarding_completed === 'object' 
          ? (profileData.onboarding_completed as Record<string, boolean>).cohost 
          : false;
        setOnboardingCompleted(completed || false);
      }
    } catch (error) {
      console.error('Error loading cohost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: { 
    skills: string[]; 
    dailyRate: number;
    minRate: number;
    maxRate: number;
    availableFrom: Date | undefined;
    availableTo: Date | undefined;
    preferredClimates: string[];
    preferredRegions: string;
  }) => {
    if (!user) return;

    try {
      // Update cohost profile with new fields
      const { error: cohostError } = await supabase
        .from('cohosts')
        .update({
          skills: data.skills,
          daily_rate: data.dailyRate,
          min_rate: data.minRate,
          max_rate: data.maxRate,
          available_from: data.availableFrom ? data.availableFrom.toISOString().split('T')[0] : null,
          available_to: data.availableTo ? data.availableTo.toISOString().split('T')[0] : null,
          preferred_climates: data.preferredClimates,
          preferred_regions: data.preferredRegions,
        })
        .eq('user_id', user.id);

      if (cohostError) throw cohostError;

      // Get current onboarding_completed state
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      const currentOnboarding = typeof profileData?.onboarding_completed === 'object'
        ? profileData.onboarding_completed as Record<string, boolean>
        : {};

      // Update profiles to mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: { ...currentOnboarding, cohost: true }
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setCohostProfile({
        skills: data.skills,
        daily_rate: data.dailyRate,
        min_rate: data.minRate,
        max_rate: data.maxRate,
        available_from: data.availableFrom ? data.availableFrom.toISOString().split('T')[0] : null,
        available_to: data.availableTo ? data.availableTo.toISOString().split('T')[0] : null,
        preferred_climates: data.preferredClimates,
        preferred_regions: data.preferredRegions,
      });
      setOnboardingCompleted(true);
      setShowOnboarding(false);
      toast.success('Co-host profile completed successfully!');

      // Send admin notification about profile completion
      const userEmail = await supabase.rpc('get_auth_email');
      const { data: profileData2 } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      supabase.functions.invoke('notify-profile-completed', {
        body: {
          name: profileData2?.name || 'Co-Host',
          email: userEmail.data || '',
          roles: ['cohost'],
          completedFields: [
            `Skills: ${data.skills.join(', ')}`,
            `Daily Rate: $${data.dailyRate}`,
            `Availability: ${data.availableFrom?.toLocaleDateString()} - ${data.availableTo?.toLocaleDateString()}`,
            `Preferred Climates: ${data.preferredClimates.join(', ')}`,
            data.preferredRegions ? `Preferred Regions: ${data.preferredRegions}` : null
          ].filter(Boolean)
        }
      }).then(({ error }) => {
        if (error) console.error('Profile completion notification failed:', error);
        else console.log('Profile completion notification sent');
      });
    } catch (error) {
      console.error('Error saving cohost profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const formatDateRange = () => {
    if (!cohostProfile?.available_from || !cohostProfile?.available_to) return 'Not set';
    try {
      const from = new Date(cohostProfile.available_from);
      const to = new Date(cohostProfile.available_to);
      return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
    } catch {
      return 'Not set';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <CohostOnboarding
            onComplete={handleOnboardingComplete}
            onBack={() => setShowOnboarding(false)}
            initialData={cohostProfile ? {
              skills: cohostProfile.skills || [],
              dailyRate: cohostProfile.daily_rate || 500,
              availableFrom: cohostProfile.available_from ? new Date(cohostProfile.available_from) : undefined,
              availableTo: cohostProfile.available_to ? new Date(cohostProfile.available_to) : undefined,
              preferredClimates: cohostProfile.preferred_climates || [],
              preferredRegions: cohostProfile.preferred_regions || '',
            } : undefined}
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
            <div className="p-2 rounded-lg bg-secondary/10">
              <Handshake className="h-6 w-6 text-secondary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Co-Host Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Find collaboration opportunities and connect with retreat hosts.
          </p>
        </div>

        {/* Complete Profile CTA */}
        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
                {onboardingCompleted ? 'Update Your Profile' : 'Complete Your Profile'}
              </h2>
              <p className="text-muted-foreground">
                {onboardingCompleted 
                  ? 'Keep your skills and availability up to date for hosts to find you.'
                  : 'Set up your skills and availability so hosts can find you.'}
              </p>
            </div>
            <Button 
              size="lg" 
              className="whitespace-nowrap"
              onClick={() => setShowOnboarding(true)}
            >
              <Handshake className="h-5 w-5 mr-2" />
              {onboardingCompleted ? 'Update Profile' : 'Complete Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Summary - Only show if onboarding completed */}
        {onboardingCompleted && cohostProfile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Co-Host Profile
              </CardTitle>
              <CardDescription>Your profile is visible to retreat hosts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Skills */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Star className="h-4 w-4" />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cohostProfile.skills && cohostProfile.skills.length > 0 ? (
                      cohostProfile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No skills set</span>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    Availability
                  </div>
                  <p className="font-medium text-sm">{formatDateRange()}</p>
                </div>

                {/* Rate */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    Daily Rate
                  </div>
                  <p className="font-medium">
                    {cohostProfile.daily_rate ? `$${cohostProfile.daily_rate}/day` : 'Not set'}
                  </p>
                </div>

                {/* Location Preferences */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    Preferred Locations
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cohostProfile.preferred_climates && cohostProfile.preferred_climates.length > 0 ? (
                      cohostProfile.preferred_climates.slice(0, 3).map((climate) => (
                        <Badge key={climate} variant="outline" className="text-xs">
                          {climate}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Any location</span>
                    )}
                    {cohostProfile.preferred_climates && cohostProfile.preferred_climates.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{cohostProfile.preferred_climates.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferred Regions - Show if set */}
              {cohostProfile.preferred_regions && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Preferred Regions</p>
                  <p className="text-sm">{cohostProfile.preferred_regions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Find Opportunities CTA */}
        <Card className="mb-8 bg-secondary border-0">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-secondary-foreground mb-1">Looking for opportunities?</h2>
              <p className="text-secondary-foreground/80">Browse retreats looking for co-hosts to collaborate with.</p>
            </div>
            <Button 
              size="lg" 
              variant="secondary"
              className="whitespace-nowrap bg-background text-foreground hover:bg-background/90"
            >
              <Search className="h-5 w-5 mr-2" />
              Find Retreats
            </Button>
          </CardContent>
        </Card>

        {/* Empty State for Collaborations */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">My Collaborations</CardTitle>
            <CardDescription>Track your co-hosting work and connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-accent mb-4">
                <Handshake className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No collaborations yet</h3>
              <p className="text-muted-foreground mb-4">Start connecting with retreat hosts to find opportunities</p>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Browse Retreats
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
