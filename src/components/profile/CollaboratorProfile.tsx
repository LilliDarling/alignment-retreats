import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SparkleEffect } from '@/components/effects/SparkleEffect';
import { AudioPlayer } from './AudioPlayer';
import { Edit, Star, MapPin, CheckCircle, Crown, Users, Briefcase, Home } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ProfileData {
  id: string;
  name: string | null;
  bio: string | null;
  profile_photo: string | null;
  cover_photo: string | null;
  theme_color?: string | null;
  profile_song_url?: string | null;
  profile_effects?: string | null;
  about_me_html?: string | null;
  layout_style?: string | null;
}

interface HostData {
  verified?: boolean | null;
  expertise_areas?: string[] | null;
  rating?: number | null;
  past_retreats_count?: number | null;
  min_rate?: number | null;
  max_rate?: number | null;
}

interface CohostData {
  verified?: boolean | null;
  skills?: string[] | null;
  rating?: number | null;
  hourly_rate?: number | null;
  availability?: string | null;
}

interface StaffData {
  verified?: boolean | null;
  service_type?: string | null;
  rating?: number | null;
  day_rate?: number | null;
  experience_years?: number | null;
  portfolio_url?: string | null;
}

interface CollaboratorProfileProps {
  profile: ProfileData;
  roles: AppRole[];
  hostData?: HostData | null;
  cohostData?: CohostData | null;
  staffData?: StaffData | null;
  isOwnProfile: boolean;
  onSendMessage?: () => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  host: <Crown className="w-4 h-4" />,
  cohost: <Users className="w-4 h-4" />,
  staff: <Briefcase className="w-4 h-4" />,
  landowner: <Home className="w-4 h-4" />,
};

const roleColors: Record<string, string> = {
  host: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cohost: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  staff: 'bg-green-500/20 text-green-400 border-green-500/30',
  landowner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function CollaboratorProfile({
  profile,
  roles,
  hostData,
  cohostData,
  staffData,
  isOwnProfile,
  onSendMessage,
}: CollaboratorProfileProps) {
  const themeColor = profile.theme_color || '#8B5CF6';
  const layoutStyle = profile.layout_style || 'modern';
  const showSparkles = profile.profile_effects === 'sparkle';
  const showGradient = profile.profile_effects === 'gradient';

  const isVerified = hostData?.verified || cohostData?.verified || staffData?.verified;

  // Generate gradient based on theme color
  const gradientStyle = {
    background: showGradient
      ? `linear-gradient(135deg, ${themeColor}33 0%, transparent 50%, ${themeColor}22 100%)`
      : undefined,
  };

  const getLayoutClasses = () => {
    switch (layoutStyle) {
      case 'classic':
        return 'border-4 border-dashed shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]';
      case 'bold':
        return 'border-2 shadow-2xl';
      default:
        return 'border shadow-lg';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo with Effects */}
      <div 
        className="relative h-64 md:h-80 overflow-hidden"
        style={{ 
          backgroundColor: themeColor + '40',
          ...gradientStyle,
        }}
      >
        {profile.cover_photo && (
          <img
            src={profile.cover_photo}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        
        <SparkleEffect enabled={showSparkles} color={themeColor} />
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 60%, ${themeColor}20 100%)`,
          }}
        />
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Profile Card */}
          <Card 
            className={`p-6 md:p-8 ${getLayoutClasses()}`}
            style={{ borderColor: themeColor + '50' }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center md:items-start">
                <div 
                  className="relative p-1 rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)`,
                  }}
                >
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background">
                    <AvatarImage src={profile.profile_photo || undefined} />
                    <AvatarFallback className="text-4xl">
                      {profile.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Song */}
                {profile.profile_song_url && (
                  <div className="mt-4 w-full">
                    <AudioPlayer url={profile.profile_song_url} themeColor={themeColor} />
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold" style={{ color: themeColor }}>
                    {profile.name || 'Anonymous'}
                  </h1>
                  {isVerified && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>

                {/* Role Badges */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {roles.filter(r => r !== 'attendee' && r !== 'admin').map(role => (
                    <Badge 
                      key={role} 
                      variant="outline" 
                      className={`${roleColors[role]} flex items-center gap-1 px-3 py-1`}
                    >
                      {roleIcons[role]}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-muted-foreground mb-4 max-w-xl">
                    {profile.bio}
                  </p>
                )}

                {/* About Me (Rich HTML) */}
                {profile.about_me_html && (
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-xl mb-4 p-4 rounded-lg bg-muted/50"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(profile.about_me_html, {
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
                        ALLOWED_ATTR: ['href', 'target', 'rel']
                      })
                    }}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center md:justify-start">
                  {isOwnProfile ? (
                    <Link to={`/profile/${profile.id}/edit`}>
                      <Button style={{ backgroundColor: themeColor }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={onSendMessage} style={{ backgroundColor: themeColor }}>
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Role-Specific Info Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Host Card */}
            {hostData && (
              <Card className={`p-6 ${getLayoutClasses()}`} style={{ borderColor: themeColor + '30' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5" style={{ color: themeColor }} />
                  <h3 className="font-semibold text-lg">Host Profile</h3>
                  {hostData.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                
                {hostData.expertise_areas && hostData.expertise_areas.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {hostData.expertise_areas.map(area => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {hostData.rating && (
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{hostData.rating}</span>
                      </div>
                    </div>
                  )}
                  {hostData.past_retreats_count !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Retreats</p>
                      <span className="font-medium">{hostData.past_retreats_count}</span>
                    </div>
                  )}
                  {(hostData.min_rate || hostData.max_rate) && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Rate Range</p>
                      <span className="font-medium">
                        ${hostData.min_rate || 0} - ${hostData.max_rate || 0}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Co-Host Card */}
            {cohostData && (
              <Card className={`p-6 ${getLayoutClasses()}`} style={{ borderColor: themeColor + '30' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" style={{ color: themeColor }} />
                  <h3 className="font-semibold text-lg">Co-Host Profile</h3>
                  {cohostData.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                
                {cohostData.skills && cohostData.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {cohostData.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {cohostData.rating && (
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{cohostData.rating}</span>
                      </div>
                    </div>
                  )}
                  {cohostData.hourly_rate && (
                    <div>
                      <p className="text-muted-foreground">Hourly Rate</p>
                      <span className="font-medium">${cohostData.hourly_rate}/hr</span>
                    </div>
                  )}
                  {cohostData.availability && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Availability</p>
                      <span className="font-medium capitalize">{cohostData.availability}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Staff Card */}
            {staffData && (
              <Card className={`p-6 ${getLayoutClasses()}`} style={{ borderColor: themeColor + '30' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5" style={{ color: themeColor }} />
                  <h3 className="font-semibold text-lg">Staff Profile</h3>
                  {staffData.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                
                {staffData.service_type && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                    <Badge variant="outline" className="capitalize">
                      {staffData.service_type.replace('_', ' ')}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {staffData.rating && (
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{staffData.rating}</span>
                      </div>
                    </div>
                  )}
                  {staffData.day_rate && (
                    <div>
                      <p className="text-muted-foreground">Day Rate</p>
                      <span className="font-medium">${staffData.day_rate}/day</span>
                    </div>
                  )}
                  {staffData.experience_years !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <span className="font-medium">{staffData.experience_years} years</span>
                    </div>
                  )}
                  {staffData.portfolio_url && (
                    <div className="col-span-2">
                      <a 
                        href={staffData.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Portfolio →
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
