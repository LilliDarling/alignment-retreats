import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProfileMediaUpload } from '@/components/ProfileMediaUpload';
import {
  User,
  Briefcase,
  Image as ImageIcon,
  Gift,
  Search,
  DollarSign,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

interface ProfileOnboardingProps {
  onComplete?: () => void;
  initialData?: Partial<ProfileData>;
  isEditMode?: boolean;
}

interface ProfileData {
  // Role and expertise
  user_roles: string[];
  expertise_areas: string[];
  bio: string;

  // What they offer and want
  what_i_offer: string;
  what_im_looking_for: string;

  // Portfolio and media
  profile_photo: string | null;
  portfolio_photos: string[];
  portfolio_videos: string[];

  // Professional details
  years_experience: number | null;
  location: string;
  availability_status: string;
  hourly_rate: number | null;
  daily_rate: number | null;
  rate_currency: string;

  // Social proof
  instagram_handle: string;
  tiktok_handle: string;
  website_url: string;
  instagram_followers: number | null;

  // Additional
  certifications: string[];
  languages: string[];
  travel_willing: boolean;
}

const ROLE_OPTIONS = [
  { value: 'host', label: 'Retreat Host', icon: User },
  { value: 'cohost', label: 'Co-Host', icon: User },
  { value: 'chef', label: 'Chef/Cook', icon: Briefcase },
  { value: 'photographer', label: 'Photographer', icon: ImageIcon },
  { value: 'videographer', label: 'Videographer', icon: ImageIcon },
  { value: 'yoga_instructor', label: 'Yoga Instructor', icon: Briefcase },
  { value: 'meditation_guide', label: 'Meditation Guide', icon: Briefcase },
  { value: 'facilitator', label: 'Workshop Facilitator', icon: Briefcase },
  { value: 'massage_therapist', label: 'Massage Therapist', icon: Briefcase },
  { value: 'sound_healer', label: 'Sound Healer', icon: Briefcase },
  { value: 'attendee', label: 'Retreat Attendee', icon: User },
];

const EXPERTISE_OPTIONS = [
  'Alignment Research',
  'AI Safety',
  'Meditation',
  'Yoga',
  'Mindfulness',
  'Plant-Based Cooking',
  'Gourmet Cuisine',
  'Photography',
  'Videography',
  'Sound Healing',
  'Massage Therapy',
  'Workshop Facilitation',
  'Breathwork',
  'Somatic Practices',
  'Nature Connection',
  'Creative Arts',
  'Music',
  'Dance',
  'Writing',
];

const CERTIFICATION_OPTIONS = [
  'RYT 200',
  'RYT 500',
  'E-RYT',
  'Culinary Arts Degree',
  'Nutritionist',
  'Licensed Massage Therapist',
  'Sound Healing Certification',
  'First Aid/CPR',
  'Wilderness First Responder',
];

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Mandarin',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
];

export function ProfileOnboarding({
  onComplete,
  initialData,
  isEditMode = false,
}: ProfileOnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  const [formData, setFormData] = useState<ProfileData>({
    user_roles: initialData?.user_roles || [],
    expertise_areas: initialData?.expertise_areas || [],
    bio: initialData?.bio || '',
    what_i_offer: initialData?.what_i_offer || '',
    what_im_looking_for: initialData?.what_im_looking_for || '',
    profile_photo: initialData?.profile_photo || null,
    portfolio_photos: initialData?.portfolio_photos || [],
    portfolio_videos: initialData?.portfolio_videos || [],
    years_experience: initialData?.years_experience || null,
    location: initialData?.location || '',
    availability_status: initialData?.availability_status || 'available',
    hourly_rate: initialData?.hourly_rate || null,
    daily_rate: initialData?.daily_rate || null,
    rate_currency: initialData?.rate_currency || 'USD',
    instagram_handle: initialData?.instagram_handle || '',
    tiktok_handle: initialData?.tiktok_handle || '',
    website_url: initialData?.website_url || '',
    instagram_followers: initialData?.instagram_followers || null,
    certifications: initialData?.certifications || [],
    languages: initialData?.languages || [],
    travel_willing: initialData?.travel_willing || false,
  });

  useEffect(() => {
    if (user) {
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    if (data?.name) setUserName(data.name);
  };

  // In edit mode, we skip the role selection step (step 1)
  const totalSteps = isEditMode ? 6 : 7;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Map current step to actual step number (accounting for skipped role selection in edit mode)
  const actualStep = isEditMode ? currentStep + 1 : currentStep;

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete your profile',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: isEditMode ? 'Profile updated' : 'Profile completed',
        description: isEditMode
          ? 'Your profile has been updated successfully'
          : 'Welcome! Your profile is now complete',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">
          {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? 'Update your information to keep your profile current'
            : 'Help others discover what you offer and what you\'re looking for'}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progressPercentage)}% complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="p-8 mb-6">
        {/* Step 1: Role Selection (skipped in edit mode) */}
        {actualStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Select Your Roles</h2>
                <p className="text-sm text-muted-foreground">
                  Choose all that apply (you can select multiple)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map(role => {
                const Icon = role.icon;
                const isSelected = formData.user_roles.includes(role.value);
                return (
                  <div
                    key={role.value}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        user_roles: toggleArrayItem(formData.user_roles, role.value),
                      })
                    }
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{role.label}</span>
                      {isSelected && <Check className="h-5 w-5 ml-auto text-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: About You */}
        {actualStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">About You</h2>
                <p className="text-sm text-muted-foreground">
                  Share your background and expertise
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell us about yourself, your background, and what drives your work..."
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be displayed on your public profile
                </p>
              </div>

              <div>
                <Label>Areas of Expertise</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map(expertise => (
                    <Badge
                      key={expertise}
                      variant={
                        formData.expertise_areas.includes(expertise)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          expertise_areas: toggleArrayItem(
                            formData.expertise_areas,
                            expertise
                          ),
                        })
                      }
                    >
                      {expertise}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.years_experience || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        years_experience: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={e =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Profile & Portfolio Media */}
        {actualStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Profile & Portfolio Media</h2>
                <p className="text-sm text-muted-foreground">
                  Upload your profile photo and showcase your work
                </p>
              </div>
            </div>

            <ProfileMediaUpload
              profilePhoto={formData.profile_photo || undefined}
              onProfilePhotoChange={url =>
                setFormData({ ...formData, profile_photo: url })
              }
              portfolioPhotos={formData.portfolio_photos}
              onPortfolioPhotosChange={urls =>
                setFormData({ ...formData, portfolio_photos: urls })
              }
              portfolioVideos={formData.portfolio_videos}
              onPortfolioVideosChange={urls =>
                setFormData({ ...formData, portfolio_videos: urls })
              }
              userName={userName}
            />
          </div>
        )}

        {/* Step 4: What You Offer */}
        {actualStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">What You Offer</h2>
                <p className="text-sm text-muted-foreground">
                  Describe the services, skills, or experiences you provide
                </p>
              </div>
            </div>

            <div>
              <Textarea
                placeholder="Example: I offer personalized yoga instruction for all levels, specializing in alignment-based vinyasa. I can lead group classes, private sessions, and design custom sequences for retreats. I also provide mindfulness workshops and meditation guidance..."
                value={formData.what_i_offer}
                onChange={e =>
                  setFormData({ ...formData, what_i_offer: e.target.value })
                }
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific about what you can provide for retreat hosts or attendees
              </p>
            </div>
          </div>
        )}

        {/* Step 5: What You're Looking For */}
        {actualStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Search className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">What You're Looking For</h2>
                <p className="text-sm text-muted-foreground">
                  Share what opportunities or experiences you're seeking
                </p>
              </div>
            </div>

            <div>
              <Textarea
                placeholder="Example: I'm looking for opportunities to co-host alignment research retreats where I can contribute my facilitation skills. Interested in collaborating with other hosts who focus on contemplative practices and community building..."
                value={formData.what_im_looking_for}
                onChange={e =>
                  setFormData({ ...formData, what_im_looking_for: e.target.value })
                }
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Help others understand how they might work with you
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Rates & Availability */}
        {actualStep === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Rates & Availability</h2>
                <p className="text-sm text-muted-foreground">
                  Set your pricing and current availability (optional)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Current Availability</Label>
                <Select
                  value={formData.availability_status}
                  onValueChange={value =>
                    setFormData({ ...formData, availability_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="limited">Limited Availability</SelectItem>
                    <SelectItem value="booked">Fully Booked</SelectItem>
                    <SelectItem value="not_available">Not Taking Bookings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hourly Rate (Optional)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="150"
                        value={formData.hourly_rate || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            hourly_rate: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Daily Rate (Optional)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="800"
                        value={formData.daily_rate || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            daily_rate: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.rate_currency}
                    onValueChange={value =>
                      setFormData({ ...formData, rate_currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="travel-willing"
                  checked={formData.travel_willing}
                  onChange={e =>
                    setFormData({ ...formData, travel_willing: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="travel-willing" className="cursor-pointer">
                  I'm willing to travel for opportunities
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Social & Professional */}
        {actualStep === 7 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <LinkIcon className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Social & Professional</h2>
                <p className="text-sm text-muted-foreground">
                  Connect your social profiles and add credentials (optional)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Instagram Handle</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <Input
                      placeholder="yourusername"
                      value={formData.instagram_handle}
                      onChange={e =>
                        setFormData({ ...formData, instagram_handle: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Follower Count (Optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={formData.instagram_followers || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        instagram_followers: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>TikTok Handle</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <Input
                      placeholder="yourusername"
                      value={formData.tiktok_handle}
                      onChange={e =>
                        setFormData({ ...formData, tiktok_handle: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Website URL</Label>
                  <Input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={formData.website_url}
                    onChange={e =>
                      setFormData({ ...formData, website_url: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Certifications</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATION_OPTIONS.map(cert => (
                    <Badge
                      key={cert}
                      variant={
                        formData.certifications.includes(cert) ? 'default' : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          certifications: toggleArrayItem(
                            formData.certifications,
                            cert
                          ),
                        })
                      }
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Languages</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select all languages you speak
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <Badge
                      key={lang}
                      variant={
                        formData.languages.includes(lang) ? 'default' : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          languages: toggleArrayItem(formData.languages, lang),
                        })
                      }
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              'Saving...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Complete Profile'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
