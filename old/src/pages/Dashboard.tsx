import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import SharedProfileSection from '@/components/dashboard/SharedProfileSection';
import HostTab from '@/components/dashboard/HostTab';
import CohostTab from '@/components/dashboard/CohostTab';
import LandownerTab from '@/components/dashboard/LandownerTab';
import StaffTab from '@/components/dashboard/StaffTab';
import AttendeeTab from '@/components/dashboard/AttendeeTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Crown, Handshake, Home, Briefcase, Heart, UserCircle, AlertCircle } from 'lucide-react';

interface ProfileData {
  name: string | null;
  bio: string | null;
  profile_photo: string | null;
  onboarding_completed: { [key: string]: boolean | undefined } | null;
  profile_completed: boolean | null;
  is_coop_member: boolean;
}

const roleLabels: Record<string, string> = {
  host: 'Host',
  cohost: 'Co-Host',
  landowner: 'Venue',
  staff: 'Staff',
  attendee: 'Attendee',
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  host: Crown,
  cohost: Handshake,
  landowner: Home,
  staff: Briefcase,
  attendee: Heart,
};

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user, userRoles, hasRole } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('name, bio, profile_photo, onboarding_completed, show_in_directory')
        .eq('id', user.id)
        .single();

      if (data) {
        // Fetch is_coop_member separately (not yet in generated types)
        const { data: coopData } = await supabase
          .from('profiles')
          .select('is_coop_member' as any)
          .eq('id', user.id)
          .single();

        setProfile({
          name: data.name,
          bio: data.bio,
          profile_photo: data.profile_photo,
          onboarding_completed: data.onboarding_completed as ProfileData['onboarding_completed'],
          profile_completed: data.show_in_directory,
          is_coop_member: (coopData as any)?.is_coop_member ?? false,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = (onboarding: Record<string, boolean | undefined>) => {
    if (profile) {
      setProfile({ ...profile, onboarding_completed: onboarding });
    }
  };

  // Only show tabs for non-admin roles the user has, in preferred order
  const roleOrder: AppRole[] = ['host', 'cohost', 'staff', 'landowner', 'attendee'];
  const displayRoles = roleOrder.filter(r => userRoles.includes(r));
  const defaultTab = displayRoles[0] || 'host';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <SharedProfileSection
          user={user}
          profile={{
            name: profile?.name || null,
            bio: profile?.bio || null,
            profile_photo: profile?.profile_photo || null,
            is_coop_member: profile?.is_coop_member ?? false,
          }}
          roles={userRoles}
        />

        {/* Profile Completion Banner */}
        {!profile?.profile_completed && (
          <Card className="mb-6 p-6 border-primary/50 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  Complete Your Profile
                  <AlertCircle className="h-4 w-4 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help others discover what you offer and what you're looking for by completing your profile.
                  Add your bio, expertise, portfolio, and more to stand out in the community.
                </p>
                <Button asChild>
                  <Link to="/profile/complete">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {hasRole('admin') && (
          <Button variant="outline" className="mb-6" asChild>
            <Link to="/admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Link>
          </Button>
        )}

        {displayRoles.length > 0 && (
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList>
              {displayRoles.map(role => {
                const Icon = roleIcons[role];
                return (
                  <TabsTrigger key={role} value={role} className="gap-1.5">
                    {Icon && <Icon className="h-4 w-4" />}
                    {roleLabels[role] || role}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {displayRoles.includes('host' as AppRole) && (
              <TabsContent value="host">
                <HostTab
                  profile={{
                    name: profile?.name || null,
                    onboarding_completed: profile?.onboarding_completed || null,
                    is_coop_member: profile?.is_coop_member ?? false,
                  }}
                  onProfileUpdate={handleProfileUpdate}
                />
              </TabsContent>
            )}

            {displayRoles.includes('cohost' as AppRole) && (
              <TabsContent value="cohost">
                <CohostTab />
              </TabsContent>
            )}

            {displayRoles.includes('landowner' as AppRole) && (
              <TabsContent value="landowner">
                <LandownerTab />
              </TabsContent>
            )}

            {displayRoles.includes('staff' as AppRole) && (
              <TabsContent value="staff">
                <StaffTab />
              </TabsContent>
            )}

            {displayRoles.includes('attendee' as AppRole) && (
              <TabsContent value="attendee">
                <AttendeeTab />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}
