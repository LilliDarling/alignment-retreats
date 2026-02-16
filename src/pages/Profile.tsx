import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Globe,
  Instagram,
  Video,
  Award,
  Languages,
  Plane,
  Edit,
  Loader2,
  Mail,
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  user_roles: string[];
  expertise_areas: string[];
  bio: string;
  what_i_offer: string;
  what_im_looking_for: string;
  profile_photo: string | null;
  portfolio_photos: string[];
  portfolio_videos: string[];
  years_experience: number | null;
  location: string;
  availability_status: string;
  hourly_rate: number | null;
  daily_rate: number | null;
  rate_currency: string;
  instagram_handle: string;
  tiktok_handle: string;
  website_url: string;
  instagram_followers: number | null;
  verified: boolean;
  certifications: string[];
  languages: string[];
  travel_willing: boolean;
  profile_completed: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  host: 'Retreat Host',
  cohost: 'Co-Host',
  chef: 'Chef/Cook',
  photographer: 'Photographer',
  videographer: 'Videographer',
  yoga_instructor: 'Yoga Instructor',
  meditation_guide: 'Meditation Guide',
  facilitator: 'Workshop Facilitator',
  massage_therapist: 'Massage Therapist',
  sound_healer: 'Sound Healer',
  attendee: 'Retreat Attendee',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available Now',
  limited: 'Limited Availability',
  booked: 'Fully Booked',
  not_available: 'Not Taking Bookings',
};

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === userId;

  usePageTitle(profile?.name ? `${profile.name}'s Profile` : 'Profile');

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        return;
      }

      setProfile(data as ProfileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatRate = (rate: number | null, type: 'hourly' | 'daily') => {
    if (!rate) return null;
    const currency = profile?.rate_currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${rate.toLocaleString()}/${type === 'hourly' ? 'hr' : 'day'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showSignOut={!!user} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This profile doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/directory">Browse Directory</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!profile.profile_completed && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader showSignOut={!!user} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Profile Incomplete</h1>
          <p className="text-muted-foreground mb-6">
            This user hasn't completed their profile yet.
          </p>
          <Button asChild>
            <Link to="/directory">Browse Directory</Link>
          </Button>
        </main>
      </div>
    );
  }

  const allMedia = [
    ...(profile.portfolio_photos || []).map(url => ({ type: 'image' as const, url })),
    ...(profile.portfolio_videos || []).map(url => ({ type: 'video' as const, url })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${profile.name}'s Profile`}
        description={profile.bio || `View ${profile.name}'s profile on Alignment Retreats`}
        canonical={`/profile/${userId}`}
      />

      <AppHeader showSignOut={!!user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <Card className="p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-32 w-32 flex-shrink-0">
              <AvatarImage src={profile.profile_photo || undefined} alt={profile.name} />
              <AvatarFallback className="text-3xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-2">
                    {profile.name}
                    {profile.verified && (
                      <Badge variant="default" className="gap-1">
                        <Award className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </h1>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.user_roles.map(role => (
                      <Badge key={role} variant="secondary">
                        {ROLE_LABELS[role] || role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isOwnProfile && (
                  <Button variant="outline" asChild>
                    <Link to="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                )}
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}

                {profile.years_experience && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.years_experience} years experience
                  </div>
                )}

                {(profile.hourly_rate || profile.daily_rate) && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatRate(profile.hourly_rate, 'hourly') || formatRate(profile.daily_rate, 'daily')}
                  </div>
                )}

                {profile.availability_status && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {AVAILABILITY_LABELS[profile.availability_status] || profile.availability_status}
                  </div>
                )}

                {profile.travel_willing && (
                  <div className="flex items-center gap-1">
                    <Plane className="h-4 w-4" />
                    Willing to travel
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2">
                {profile.instagram_handle && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://instagram.com/${profile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      @{profile.instagram_handle}
                      {profile.instagram_followers && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({(profile.instagram_followers / 1000).toFixed(1)}K)
                        </span>
                      )}
                    </a>
                  </Button>
                )}

                {profile.tiktok_handle && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://tiktok.com/@${profile.tiktok_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      @{profile.tiktok_handle}
                    </a>
                  </Button>
                )}

                {profile.website_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}

                {!isOwnProfile && (
                  <Button variant="default" size="sm" asChild>
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </Card>
            )}

            {/* What I Offer */}
            {profile.what_i_offer && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">What I Offer</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.what_i_offer}
                </p>
              </Card>
            )}

            {/* What I'm Looking For */}
            {profile.what_im_looking_for && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">What I'm Looking For</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.what_im_looking_for}
                </p>
              </Card>
            )}

            {/* Portfolio */}
            {allMedia.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
                <Carousel className="w-full">
                  <CarouselContent>
                    {allMedia.map((item, index) => (
                      <CarouselItem key={index} className="md:basis-1/2">
                        {item.type === 'image' ? (
                          <div className="aspect-square rounded-lg overflow-hidden">
                            <img
                              src={item.url}
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <video
                              src={item.url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Expertise */}
            {profile.expertise_areas.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.expertise_areas.map(area => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certifications
                </h3>
                <div className="space-y-2">
                  {profile.certifications.map(cert => (
                    <div key={cert} className="text-sm text-muted-foreground">
                      • {cert}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(lang => (
                    <Badge key={lang} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Rates (if set) */}
            {(profile.hourly_rate || profile.daily_rate) && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Rates
                </h3>
                <div className="space-y-2 text-sm">
                  {profile.hourly_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly:</span>
                      <span className="font-medium">{formatRate(profile.hourly_rate, 'hourly')}</span>
                    </div>
                  )}
                  {profile.daily_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily:</span>
                      <span className="font-medium">{formatRate(profile.daily_rate, 'daily')}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
