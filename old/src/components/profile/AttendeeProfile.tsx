import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { parseDateOnly } from '@/lib/dateOnly';

interface Booking {
  id: string;
  retreat_id: string;
  booking_date: string;
  retreat?: {
    title: string;
    start_date: string;
    end_date: string;
  };
}

interface AttendeeProfileProps {
  profile: {
    id: string;
    name: string | null;
    bio: string | null;
    profile_photo: string | null;
  };
  bookings?: Booking[];
  isOwnProfile: boolean;
}

export function AttendeeProfile({ profile, bookings = [], isOwnProfile }: AttendeeProfileProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple gradient header */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />

      <div className="container mx-auto px-4 -mt-16 relative z-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Card */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.profile_photo || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold mt-4">{profile.name || 'Anonymous'}</h1>
                
                <Badge variant="secondary" className="mt-2">
                  Retreat Attendee
                </Badge>

                {profile.bio && (
                  <p className="text-muted-foreground mt-4 max-w-md">
                    {profile.bio}
                  </p>
                )}

                {isOwnProfile && (
                  <Link to={`/profile/${profile.id}/edit`} className="mt-4">
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Retreats Section - Only visible to profile owner */}
          {isOwnProfile && (
            <Card className="max-w-2xl mx-auto mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  My Retreats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You haven't booked any retreats yet.
                    </p>
                    <Link to="/retreats">
                      <Button>
                        Browse Retreats
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(booking => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <h4 className="font-medium">
                            {booking.retreat?.title || 'Retreat'}
                          </h4>
                          {booking.retreat?.start_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {parseDateOnly(booking.retreat.start_date)?.toLocaleDateString()}
                              {booking.retreat.end_date && (
                                <> - {parseDateOnly(booking.retreat.end_date)?.toLocaleDateString()}</>
                              )}
                            </p>
                          )}
                        </div>
                        <Link to={`/retreat/${booking.retreat_id}`}>
                          <Button variant="ghost" size="sm">
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* If not own profile and no public info, show minimal message */}
          {!isOwnProfile && (
            <Card className="max-w-2xl mx-auto mt-6">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>This is a private attendee profile.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
