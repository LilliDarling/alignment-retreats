import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Target,
  Briefcase,
  Star,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface MemberDetailDrawerProps {
  memberId: string | null;
  open: boolean;
  onClose: () => void;
}

interface HostData {
  expertise_areas: string[] | null;
  min_rate: number | null;
  max_rate: number | null;
  rating: number | null;
  verified: boolean | null;
  past_retreats_count: number | null;
}

interface CohostData {
  skills: string[] | null;
  hourly_rate: number | null;
  min_rate: number | null;
  max_rate: number | null;
  availability: string | null;
  rating: number | null;
  verified: boolean | null;
}

interface StaffData {
  service_type: string | null;
  day_rate: number | null;
  min_rate: number | null;
  max_rate: number | null;
  availability: string | null;
  experience_years: number | null;
  verified: boolean | null;
}

interface RetreatWish {
  id: string;
  retreat_types: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  location_preferences: string[] | null;
  preferred_timeframe: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
}

interface RetreatSubmission {
  id: string;
  title: string;
  retreat_type: string | null;
  price_per_person: number | null;
  looking_for: any;
  status: string | null;
  created_at: string | null;
}

interface ProfileData {
  id: string;
  name: string | null;
  bio: string | null;
  profile_photo: string | null;
  created_at: string | null;
}

export function MemberDetailDrawer({ memberId, open, onClose }: MemberDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [verifyingRole, setVerifyingRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [hostData, setHostData] = useState<HostData | null>(null);
  const [cohostData, setCohostData] = useState<CohostData | null>(null);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [retreatWishes, setRetreatWishes] = useState<RetreatWish[]>([]);
  const [retreatSubmissions, setRetreatSubmissions] = useState<RetreatSubmission[]>([]);

  const handleToggleVerification = async (
    table: 'hosts' | 'cohosts' | 'staff_profiles',
    currentStatus: boolean
  ) => {
    if (!memberId) return;
    
    setVerifyingRole(table);
    try {
      const { error } = await supabase
        .from(table)
        .update({ verified: !currentStatus })
        .eq('user_id', memberId);

      if (error) throw error;

      // Update local state
      if (table === 'hosts') {
        setHostData(prev => prev ? { ...prev, verified: !currentStatus } : null);
      } else if (table === 'cohosts') {
        setCohostData(prev => prev ? { ...prev, verified: !currentStatus } : null);
      } else {
        setStaffData(prev => prev ? { ...prev, verified: !currentStatus } : null);
      }

      toast({
        title: !currentStatus ? 'Member Verified' : 'Verification Removed',
        description: `${profile?.name || 'Member'} ${table.replace('_profiles', '')} verification updated.`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingRole(null);
    }
  };

  useEffect(() => {
    if (memberId && open) {
      fetchMemberData();
    }
  }, [memberId, open]);

  const fetchMemberData = async () => {
    if (!memberId) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, bio, profile_photo, created_at')
        .eq('id', memberId)
        .single();
      
      setProfile(profileData);

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberId);
      
      setRoles(rolesData?.map(r => r.role) || []);

      // Fetch host data if host role
      const { data: hostInfo } = await supabase
        .from('hosts')
        .select('*')
        .eq('user_id', memberId)
        .single();
      
      setHostData(hostInfo);

      // Fetch cohost data if cohost role
      const { data: cohostInfo } = await supabase
        .from('cohosts')
        .select('*')
        .eq('user_id', memberId)
        .single();
      
      setCohostData(cohostInfo);

      // Fetch staff data if staff role
      const { data: staffInfo } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', memberId)
        .single();
      
      setStaffData(staffInfo);

      // Fetch retreat wishes (for attendees)
      const { data: wishes } = await supabase
        .from('retreat_wishes')
        .select('*')
        .eq('user_id', memberId)
        .order('created_at', { ascending: false });
      
      setRetreatWishes(wishes || []);

      // Fetch retreat submissions (for hosts)
      const { data: submissions } = await supabase
        .from('retreats')
        .select('id, title, retreat_type, price_per_person, looking_for, status, created_at')
        .eq('host_user_id', memberId)
        .order('created_at', { ascending: false });
      
      setRetreatSubmissions(submissions || []);

    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleColors: Record<string, string> = {
    host: 'bg-primary/10 text-primary border-primary/20',
    cohost: 'bg-primary/8 text-primary/80 border-primary/15',
    landowner: 'bg-secondary text-secondary-foreground border-border',
    staff: 'bg-muted text-muted-foreground border-border',
    attendee: 'bg-secondary text-secondary-foreground border-secondary',
    admin: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3">
            {profile?.profile_photo ? (
              <img 
                src={profile.profile_photo} 
                alt={profile.name || 'Member'} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  <span>{profile?.name || 'Unnamed Member'}</span>
                  <div className="flex gap-1 mt-1">
                    {roles.map(role => (
                      <Badge key={role} variant="outline" className={`text-xs ${roleColors[role]}`}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Unknown'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs defaultValue={roles.includes('host') ? 'host' : roles[0] || 'profile'} className="space-y-4">
            <TabsList className="flex flex-wrap gap-1">
              {roles.includes('host') && <TabsTrigger value="host">Host Info</TabsTrigger>}
              {roles.includes('cohost') && <TabsTrigger value="cohost">Co-Host Info</TabsTrigger>}
              {roles.includes('staff') && <TabsTrigger value="staff">Staff Info</TabsTrigger>}
              {roles.includes('attendee') && <TabsTrigger value="attendee">Attendee Wishes</TabsTrigger>}
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            {/* Host Tab */}
            {roles.includes('host') && (
              <TabsContent value="host" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Expertise & Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Expertise Areas</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {hostData?.expertise_areas?.length ? (
                          hostData.expertise_areas.map(area => (
                            <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Rate Range</span>
                        <p className="font-medium">
                          {hostData?.min_rate && hostData?.max_rate 
                            ? `$${hostData.min_rate} - $${hostData.max_rate}` 
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Verified</span>
                        <div className="flex items-center gap-2 mt-1">
                          {hostData?.verified ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" /> No
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={hostData?.verified ? "destructive" : "default"}
                            onClick={() => handleToggleVerification('hosts', hostData?.verified || false)}
                            disabled={verifyingRole === 'hosts'}
                          >
                            {verifyingRole === 'hosts' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {hostData?.verified ? 'Unverify' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Past Retreats</span>
                        <p className="font-medium">{hostData?.past_retreats_count || 0}</p>
                      </div>
                      {hostData?.rating && (
                        <div>
                          <span className="text-xs text-muted-foreground">Rating</span>
                          <p className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            {hostData.rating}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Co-Host Tab */}
            {roles.includes('cohost') && (
              <TabsContent value="cohost" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Skills & Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cohostData?.skills?.length ? (
                          cohostData.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Not specified</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Hourly Rate</span>
                        <p className="font-medium">
                          {cohostData?.hourly_rate ? `$${cohostData.hourly_rate}/hr` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Rate Range</span>
                        <p className="font-medium">
                          {cohostData?.min_rate && cohostData?.max_rate 
                            ? `$${cohostData.min_rate} - $${cohostData.max_rate}` 
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Availability</span>
                        <p className="font-medium capitalize">{cohostData?.availability || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Verified</span>
                        <div className="flex items-center gap-2 mt-1">
                          {cohostData?.verified ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" /> No
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={cohostData?.verified ? "destructive" : "default"}
                            onClick={() => handleToggleVerification('cohosts', cohostData?.verified || false)}
                            disabled={verifyingRole === 'cohosts'}
                          >
                            {verifyingRole === 'cohosts' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {cohostData?.verified ? 'Unverify' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Staff Tab */}
            {roles.includes('staff') && (
              <TabsContent value="staff" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Service & Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Service Type</span>
                        <p className="font-medium capitalize">{staffData?.service_type || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Day Rate</span>
                        <p className="font-medium">
                          {staffData?.day_rate ? `$${staffData.day_rate}/day` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Rate Range</span>
                        <p className="font-medium">
                          {staffData?.min_rate && staffData?.max_rate 
                            ? `$${staffData.min_rate} - $${staffData.max_rate}` 
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Experience</span>
                        <p className="font-medium">
                          {staffData?.experience_years ? `${staffData.experience_years} years` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Availability</span>
                        <p className="font-medium capitalize">{staffData?.availability || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Verified</span>
                        <div className="flex items-center gap-2 mt-1">
                          {staffData?.verified ? (
                            <span className="flex items-center gap-1 text-primary">
                              <CheckCircle className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" /> No
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={staffData?.verified ? "destructive" : "default"}
                            onClick={() => handleToggleVerification('staff_profiles', staffData?.verified || false)}
                            disabled={verifyingRole === 'staff_profiles'}
                          >
                            {verifyingRole === 'staff_profiles' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {staffData?.verified ? 'Unverify' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Attendee Wishes Tab */}
            {roles.includes('attendee') && (
              <TabsContent value="attendee" className="space-y-4">
                {retreatWishes.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No retreat wishes submitted yet
                    </CardContent>
                  </Card>
                ) : (
                  retreatWishes.map(wish => (
                    <Card key={wish.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {wish.created_at ? format(new Date(wish.created_at), 'MMM d, yyyy') : 'Unknown'}
                          </span>
                          <Badge variant={wish.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {wish.status || 'active'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {wish.retreat_types?.length ? (
                          <div>
                            <span className="text-xs text-muted-foreground">Interested In</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wish.retreat_types.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Budget
                            </span>
                            <p className="font-medium">
                              ${wish.budget_min || 0} - ${wish.budget_max || 0}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Priority</span>
                            <p className="font-medium capitalize">{wish.priority || 'balanced'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Timeframe</span>
                            <p className="font-medium">{wish.preferred_timeframe || 'Flexible'}</p>
                          </div>
                        </div>
                        {wish.location_preferences?.length ? (
                          <div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Locations
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wish.location_preferences.map(loc => (
                                <Badge key={loc} variant="outline" className="text-xs">{loc}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            )}

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              {retreatSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No retreat submissions yet
                  </CardContent>
                </Card>
              ) : (
                retreatSubmissions.map(sub => (
                  <Card key={sub.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{sub.title}</span>
                        <Badge 
                          variant={sub.status === 'published' ? 'default' : sub.status === 'approved' ? 'secondary' : sub.status === 'pending_review' ? 'outline' : 'destructive'}
                          className="text-xs"
                        >
                          {sub.status?.replace('_', ' ') || 'pending review'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Type</span>
                          <p className="font-medium">{sub.retreat_type || 'Not set'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Price/Person</span>
                          <p className="font-medium">
                            {sub.price_per_person ? `$${sub.price_per_person}` : 'Not set'}
                          </p>
                        </div>
                      </div>
                      {sub.looking_for?.needs?.length ? (
                        <div>
                          <span className="text-xs text-muted-foreground">Looking For</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sub.looking_for.needs.map((need: string) => (
                              <Badge key={need} variant="outline" className="text-xs capitalize">{need}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
