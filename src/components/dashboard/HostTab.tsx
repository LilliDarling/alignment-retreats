import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { HostOnboarding } from '@/components/onboarding/HostOnboarding';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  Image
} from 'lucide-react';

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

interface HostTabProps {
  profile: {
    name: string | null;
    onboarding_completed: { host?: boolean; [key: string]: boolean | undefined } | null;
  };
  onProfileUpdate: (onboarding: Record<string, boolean | undefined>) => void;
}

export default function HostTab({ profile, onProfileUpdate }: HostTabProps) {
  const { user } = useAuth();
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

      // Auto-trigger onboarding if host hasn't completed their profile
      if (profile.onboarding_completed?.host !== true) {
        setShowOnboarding(true);
      }

      setLoading(false);
    };

    fetchHostData();
  }, [user, profile.onboarding_completed?.host]);

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
      {/* Complete Profile CTA */}
      <Card>
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

      {/* Co-Op CTA */}
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

      {/* Profile Summary */}
      {isOnboardingCompleted && hostProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Your Host Profile</CardTitle>
            <CardDescription>Your current profile settings</CardDescription>
          </CardHeader>
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
        </Card>
      )}
    </div>
  );
}
