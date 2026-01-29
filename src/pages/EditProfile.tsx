import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, userRoles, updatePassword } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Host fields
  const [expertiseAreas, setExpertiseAreas] = useState('');
  const [hostMinRate, setHostMinRate] = useState('');
  const [hostMaxRate, setHostMaxRate] = useState('');

  // Cohost fields
  const [skills, setSkills] = useState('');
  const [cohostAvailability, setCohostAvailability] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [cohostMinRate, setCohostMinRate] = useState('');
  const [cohostMaxRate, setCohostMaxRate] = useState('');

  // Staff fields
  const [serviceType, setServiceType] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [staffAvailability, setStaffAvailability] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [staffMinRate, setStaffMinRate] = useState('');
  const [staffMaxRate, setStaffMaxRate] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['ownProfile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch host data
  const { data: hostData } = useQuery({
    queryKey: ['ownHostData', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hosts')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: userRoles.includes('host'),
  });

  // Fetch cohost data
  const { data: cohostData } = useQuery({
    queryKey: ['ownCohostData', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('cohosts')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: userRoles.includes('cohost'),
  });

  // Fetch staff data
  const { data: staffData } = useQuery({
    queryKey: ['ownStaffData', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: userRoles.includes('staff'),
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setProfilePhoto(profile.profile_photo || '');
      setCoverPhoto(profile.cover_photo || '');
    }
  }, [profile]);

  useEffect(() => {
    if (hostData) {
      setExpertiseAreas(hostData.expertise_areas?.join(', ') || '');
      setHostMinRate(hostData.min_rate?.toString() || '');
      setHostMaxRate(hostData.max_rate?.toString() || '');
    }
  }, [hostData]);

  useEffect(() => {
    if (cohostData) {
      setSkills(cohostData.skills?.join(', ') || '');
      setCohostAvailability(cohostData.availability || '');
      setHourlyRate(cohostData.hourly_rate?.toString() || '');
      setCohostMinRate(cohostData.min_rate?.toString() || '');
      setCohostMaxRate(cohostData.max_rate?.toString() || '');
    }
  }, [cohostData]);

  useEffect(() => {
    if (staffData) {
      setServiceType(staffData.service_type || '');
      setExperienceYears(staffData.experience_years?.toString() || '');
      setStaffAvailability(staffData.availability || '');
      setDayRate(staffData.day_rate?.toString() || '');
      setPortfolioUrl(staffData.portfolio_url || '');
      setStaffMinRate(staffData.min_rate?.toString() || '');
      setStaffMaxRate(staffData.max_rate?.toString() || '');
    }
  }, [staffData]);

  // Upload photo handler
  const uploadPhoto = async (file: File, bucket: string, type: 'profile' | 'cover') => {
    if (type === 'profile') setUploadingProfile(true);
    else setUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (type === 'profile') setProfilePhoto(publicUrl);
      else setCoverPhoto(publicUrl);

      toast({
        title: 'Photo uploaded',
        description: `${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      if (type === 'profile') setUploadingProfile(false);
      else setUploadingCover(false);
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          bio,
          profile_photo: profilePhoto,
          cover_photo: coverPhoto,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update host data
      if (userRoles.includes('host')) {
        await supabase
          .from('hosts')
          .update({
            expertise_areas: expertiseAreas.split(',').map(s => s.trim()).filter(Boolean),
            min_rate: hostMinRate ? parseFloat(hostMinRate) : null,
            max_rate: hostMaxRate ? parseFloat(hostMaxRate) : null,
          })
          .eq('user_id', user?.id);
      }

      // Update cohost data
      if (userRoles.includes('cohost')) {
        await supabase
          .from('cohosts')
          .update({
            skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            availability: cohostAvailability,
            hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
            min_rate: cohostMinRate ? parseFloat(cohostMinRate) : null,
            max_rate: cohostMaxRate ? parseFloat(cohostMaxRate) : null,
          })
          .eq('user_id', user?.id);
      }

      // Update staff data
      if (userRoles.includes('staff')) {
        await supabase
          .from('staff_profiles')
          .update({
            service_type: serviceType,
            experience_years: experienceYears ? parseInt(experienceYears) : 0,
            availability: staffAvailability,
            day_rate: dayRate ? parseFloat(dayRate) : null,
            portfolio_url: portfolioUrl,
            min_rate: staffMinRate ? parseFloat(staffMinRate) : null,
            max_rate: staffMaxRate ? parseFloat(staffMaxRate) : null,
          })
          .eq('user_id', user?.id);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ownProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      
      // Send profile completion notification
      const completedFields: string[] = [];
      if (name) completedFields.push('Name');
      if (bio) completedFields.push('Bio');
      if (profilePhoto) completedFields.push('Profile Photo');
      if (coverPhoto) completedFields.push('Cover Photo');
      if (userRoles.includes('host') && expertiseAreas) completedFields.push('Host Expertise');
      if (userRoles.includes('cohost') && skills) completedFields.push('Co-Host Skills');
      if (userRoles.includes('staff') && serviceType) completedFields.push('Staff Services');

      if (completedFields.length > 0) {
        const { data: authData } = await supabase.auth.getUser();
        supabase.functions.invoke('notify-profile-completed', {
          body: { 
            name, 
            email: authData?.user?.email || 'Unknown',
            roles: userRoles,
            completedFields 
          }
        }).catch(err => console.error('Profile notification failed:', err));
      }

      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully.',
      });
      navigate(`/profile/${user?.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePasswordSave = async () => {
    setPasswordErrors({});

    const validation = passwordSchema.safeParse({ password: newPassword, confirmPassword });
    if (!validation.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    setSavingPassword(true);

    const { error } = await updatePassword(newPassword);

    if (error) {
      toast({
        title: 'Error updating password',
        description: error.message,
        variant: 'destructive',
      });
      setSavingPassword(false);
      return;
    }

    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });

    setNewPassword('');
    setConfirmPassword('');
    setSavingPassword(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="font-semibold text-foreground">Edit Profile</h1>
          <Button 
            size="sm" 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Cover Photo */}
        <div className="relative h-40 bg-accent rounded-xl overflow-hidden mb-16">
          {coverPhoto && (
            <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file, 'profile-photos', 'cover');
              }}
              disabled={uploadingCover}
            />
            <div className="flex items-center gap-2 text-white">
              {uploadingCover ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span>Change cover photo</span>
                </>
              )}
            </div>
          </label>

          {/* Profile Photo */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profilePhoto} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file, 'profile-photos', 'profile');
                  }}
                  disabled={uploadingProfile}
                />
                {uploadingProfile ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Basic Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </section>

          {/* Host Fields */}
          {userRoles.includes('host') && (
            <>
              <Separator />
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Host Profile</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="expertise">Expertise Areas (comma-separated)</Label>
                  <Input
                    id="expertise"
                    value={expertiseAreas}
                    onChange={(e) => setExpertiseAreas(e.target.value)}
                    placeholder="Yoga, Meditation, Sound Healing"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostMinRate">Min Rate ($/retreat)</Label>
                    <Input
                      id="hostMinRate"
                      type="number"
                      value={hostMinRate}
                      onChange={(e) => setHostMinRate(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostMaxRate">Max Rate ($/retreat)</Label>
                    <Input
                      id="hostMaxRate"
                      type="number"
                      value={hostMaxRate}
                      onChange={(e) => setHostMaxRate(e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Cohost Fields */}
          {userRoles.includes('cohost') && (
            <>
              <Separator />
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Co-Host Profile</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Event planning, Photography, Cooking"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cohostMinRate">Min Rate ($/hr)</Label>
                    <Input
                      id="cohostMinRate"
                      type="number"
                      value={cohostMinRate}
                      onChange={(e) => setCohostMinRate(e.target.value)}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cohostMaxRate">Max Rate ($/hr)</Label>
                    <Input
                      id="cohostMaxRate"
                      type="number"
                      value={cohostMaxRate}
                      onChange={(e) => setCohostMaxRate(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cohostAvailability">Availability</Label>
                    <Input
                      id="cohostAvailability"
                      value={cohostAvailability}
                      onChange={(e) => setCohostAvailability(e.target.value)}
                      placeholder="Weekends, Full-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Staff Fields */}
          {userRoles.includes('staff') && (
            <>
              <Separator />
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Staff Profile</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Input
                      id="serviceType"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      placeholder="Chef, Photographer, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffMinRate">Min Rate ($/day)</Label>
                    <Input
                      id="staffMinRate"
                      type="number"
                      value={staffMinRate}
                      onChange={(e) => setStaffMinRate(e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffMaxRate">Max Rate ($/day)</Label>
                    <Input
                      id="staffMaxRate"
                      type="number"
                      value={staffMaxRate}
                      onChange={(e) => setStaffMaxRate(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffAvailability">Availability</Label>
                    <Input
                      id="staffAvailability"
                      value={staffAvailability}
                      onChange={(e) => setStaffAvailability(e.target.value)}
                      placeholder="Available year-round"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayRate">Day Rate ($)</Label>
                    <Input
                      id="dayRate"
                      type="number"
                      value={dayRate}
                      onChange={(e) => setDayRate(e.target.value)}
                      placeholder="350"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://your-portfolio.com"
                  />
                </div>
              </section>
            </>
          )}

          <Separator />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Set Password</h2>
            <p className="text-sm text-muted-foreground">
              Set or change your password for email/password login.
            </p>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              {passwordErrors.password && (
                <p className="text-sm text-destructive">{passwordErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              onClick={handlePasswordSave}
              disabled={savingPassword || !newPassword || !confirmPassword}
              variant="outline"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Password
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
