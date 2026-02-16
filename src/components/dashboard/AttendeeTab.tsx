import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Calendar,
  Search,
  Sparkles,
  MapPin,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';

interface Booking {
  id: string;
  booking_date: string;
  retreat: {
    title: string;
    start_date: string | null;
    end_date: string | null;
  } | null;
  paymentStatus?: string;
  isPaid?: boolean;
}

interface RetreatWish {
  id: string;
  retreat_types: string[];
  budget_min: number | null;
  budget_max: number | null;
  location_preferences: string[];
  preferred_timeframe: string | null;
  status: string;
  created_at: string;
}

export default function AttendeeTab() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishes, setWishes] = useState<RetreatWish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          retreats (
            title,
            start_date,
            end_date
          )
        `)
        .eq('attendee_user_id', user!.id)
        .order('booking_date', { ascending: false });

      if (bookingsData) {
        const bookingsWithStatus = await Promise.all(
          bookingsData.map(async (b) => {
            const { data: paymentData } = await supabase.rpc('get_booking_payment_status', {
              booking_uuid: b.id
            });
            const payment = paymentData?.[0];
            return {
              id: b.id,
              booking_date: b.booking_date,
              retreat: b.retreats as Booking['retreat'],
              paymentStatus: payment?.status || 'pending',
              isPaid: payment?.is_paid || false
            };
          })
        );
        setBookings(bookingsWithStatus);
      }

      const { data: wishesData } = await supabase
        .from('retreat_wishes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (wishesData) {
        setWishes(wishesData);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      case 'refunded':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Build Dream Retreat CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border border-border shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Build Your Dream Retreat</h2>
            <p className="text-muted-foreground">Tell us exactly what you're looking for and we'll find it for you.</p>
          </div>
          <Link to="/build-retreat">
            <Button size="lg" className="whitespace-nowrap">
              <Sparkles className="h-5 w-5 mr-2" />
              Build My Retreat
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Find Retreats CTA */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Ready for transformation?</h2>
            <p className="text-muted-foreground">Discover your next retreat experience.</p>
          </div>
          <Link to="/retreats/browse">
            <Button size="lg" variant="outline" className="whitespace-nowrap">
              <Search className="h-5 w-5 mr-2" />
              Browse Retreats
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Retreats</p>
                <p className="text-2xl font-bold text-foreground">
                  {bookings.filter(b => b.isPaid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dream Retreats</p>
                <p className="text-2xl font-bold text-foreground">{wishes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retreat Wishes */}
      {wishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              My Dream Retreats
            </CardTitle>
            <CardDescription>Retreat preferences you've submitted - we'll notify you when we find matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wishes.map((wish) => (
                <div
                  key={wish.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex flex-wrap gap-1">
                        {wish.retreat_types.slice(0, 3).map(type => (
                          <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                        ))}
                        {wish.retreat_types.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{wish.retreat_types.length - 3}</Badge>
                        )}
                      </div>
                      <Badge variant={wish.status === 'active' ? 'default' : 'outline'}>
                        {wish.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {wish.budget_min && wish.budget_max && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${wish.budget_min} - ${wish.budget_max}
                        </span>
                      )}
                      {wish.location_preferences.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {wish.location_preferences.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">My Bookings</CardTitle>
          <CardDescription>Your upcoming and past retreat experiences</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-accent/10 mb-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">Discover retreats that speak to your soul</p>
              <Link to="/retreats/browse">
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Retreats
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {booking.retreat?.title || 'Retreat'}
                      </h3>
                      <Badge className={getStatusColor(booking.paymentStatus || 'pending')}>
                        {booking.paymentStatus || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {booking.retreat?.start_date && booking.retreat?.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(parseDateOnly(booking.retreat.start_date)!, 'MMM d')} - {format(parseDateOnly(booking.retreat.end_date)!, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
