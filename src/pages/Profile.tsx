import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Briefcase, 
  Clock, 
  DollarSign,
  MessageCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageModal } from '@/components/MessageModal';
import { RetreatCard } from '@/components/RetreatCard';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<any> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user roles
  const { data: roles } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      return data?.map(r => r.role) || [];
    },
    enabled: !!userId,
  });

  // Fetch host-specific data
  const { data: hostData } = useQuery({
    queryKey: ['hostData', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('hosts')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: roles?.includes('host'),
  });

  // Fetch cohost-specific data
  const { data: cohostData } = useQuery({
    queryKey: ['cohostData', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cohosts')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: roles?.includes('cohost'),
  });

  // Fetch staff-specific data
  const { data: staffData } = useQuery({
    queryKey: ['staffData', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: roles?.includes('staff'),
  });

  // Fetch host's retreats
  const { data: hostRetreats } = useQuery({
    queryKey: ['hostRetreats', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('retreats')
        .select('*')
        .eq('host_user_id', userId)
        .eq('status', 'published');
      return data || [];
    },
    enabled: roles?.includes('host'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'host': return 'bg-primary/10 text-primary border-primary/20';
      case 'cohost': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'staff': return 'bg-accent text-accent-foreground border-accent';
      case 'landowner': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20">
        {profile.cover_photo && (
          <img 
            src={profile.cover_photo} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Edit Button (own profile) */}
        {isOwnProfile && (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile/edit')}
            className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.profile_photo} />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {profile.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Name & Roles */}
            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {profile.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {roles?.map(role => (
                  <Badge 
                    key={role} 
                    variant="outline" 
                    className={getRoleBadgeColor(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <Button 
                onClick={() => setMessageModalOpen(true)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Send Message
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          </div>
        )}

        <Separator className="my-8" />

        {/* Role-Specific Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Host Info */}
          {hostData && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Host Profile
              </h3>
              {hostData.expertise_areas?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hostData.expertise_areas.map((area: string) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                {hostData.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {hostData.rating}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {hostData.past_retreats_count || 0} retreats hosted
                </span>
              </div>
              {hostData.verified && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  ✓ Verified Host
                </Badge>
              )}
            </div>
          )}

          {/* Cohost Info */}
          {cohostData && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-secondary" />
                Co-Host Profile
              </h3>
              {cohostData.skills?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cohostData.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2 text-sm">
                {cohostData.availability && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {cohostData.availability}
                  </div>
                )}
                {cohostData.hourly_rate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    ${cohostData.hourly_rate}/hour
                  </div>
                )}
                {cohostData.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {cohostData.rating} • {cohostData.past_collaborations_count || 0} collaborations
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staff Info */}
          {staffData && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent-foreground" />
                Staff Profile
              </h3>
              {staffData.service_type && (
                <Badge variant="secondary">{staffData.service_type}</Badge>
              )}
              <div className="space-y-2 text-sm">
                {staffData.experience_years > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {staffData.experience_years} years experience
                  </div>
                )}
                {staffData.availability && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {staffData.availability}
                  </div>
                )}
                {staffData.day_rate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    ${staffData.day_rate}/day
                  </div>
                )}
                {staffData.portfolio_url && (
                  <a 
                    href={staffData.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Portfolio
                  </a>
                )}
                {staffData.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {staffData.rating}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Host's Retreats */}
        {hostRetreats && hostRetreats.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Retreats by {profile.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostRetreats.map((retreat: any) => (
                <RetreatCard
                  key={retreat.id}
                  id={retreat.id}
                  title={retreat.title}
                  location={retreat.location || 'Location TBD'}
                  image="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                  startDate={retreat.start_date}
                  endDate={retreat.end_date}
                  pricePerPerson={retreat.price_per_person || 0}
                  retreatType={retreat.retreat_type}
                  hostName={profile.name}
                  maxAttendees={retreat.max_attendees}
                  onClick={() => navigate(`/retreat/${retreat.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Message Modal */}
      <MessageModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        recipientId={userId}
        recipientName={profile.name}
        recipientPhoto={profile.profile_photo}
      />
    </div>
  );
}
