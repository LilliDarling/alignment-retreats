import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Crown, Pencil } from 'lucide-react';
import { AppRole } from '@/contexts/AuthContext';

interface SharedProfileSectionProps {
  user: User;
  profile: {
    name: string | null;
    bio: string | null;
    profile_photo: string | null;
  };
  roles: AppRole[];
}

const roleLabels: Record<string, string> = {
  host: 'Host',
  cohost: 'Co-Host',
  landowner: 'Venue Partner',
  staff: 'Staff',
  attendee: 'Attendee',
  admin: 'Admin',
};

export default function SharedProfileSection({ user, profile, roles }: SharedProfileSectionProps) {
  const location = (user.user_metadata?.onboarding as Record<string, Record<string, string>> | undefined)?.profile?.location;
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.profile_photo || undefined} alt={profile.name || 'Profile'} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {profile.name || 'Welcome'}
                </h1>
                {location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile/edit">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {roles.map(role => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {roleLabels[role] || role}
                </Badge>
              ))}
              <Link to="/cooperative" className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-1">
                <Crown className="h-3 w-3" />
                Join the Co-Op
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
