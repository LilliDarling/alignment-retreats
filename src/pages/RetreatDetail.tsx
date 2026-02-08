import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  Heart,
  Calendar,
  Users,
  MapPin,
  ArrowLeft,
  Share2,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSingleRetreatAvailability } from '@/hooks/useRetreatAvailability';
import { useWaitlistStatus, useJoinWaitlist, useLeaveWaitlist } from '@/hooks/useWaitlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ItineraryDisplay } from '@/components/ItineraryDisplay';
import { cn } from '@/lib/utils';
import { parseDateOnly } from '@/lib/dateOnly';
import { toast } from 'sonner';

export default function RetreatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch retreat from database only
  const { data: retreat, isLoading, error } = useQuery({
    queryKey: ['retreat', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        location: (data as any).location || 'Location TBD',
        image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop',
        amenities: ['Daily sessions', 'Healthy meals', 'Guided activities'],
        schedule: [],
      };
    },
  });

  const { availability } = useSingleRetreatAvailability(id);
  const { data: waitlistEntry } = useWaitlistStatus(id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  const isFull = availability?.is_full ?? false;
  const spotsRemaining = availability?.spots_remaining;
  const isOnWaitlist = !!waitlistEntry;

  // Set page title based on retreat
  usePageTitle(retreat?.title || 'Retreat Details');


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading retreat...</div>
      </div>
    );
  }

  if (error || !retreat) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Retreat not found</p>
        <Button onClick={() => navigate('/retreats/browse')}>Browse Retreats</Button>
      </div>
    );
  }

  const formatDateRange = () => {
    if (!retreat.start_date || !retreat.end_date) return 'Dates TBD';
    const start = parseDateOnly(retreat.start_date);
    const end = parseDateOnly(retreat.end_date);
    if (!start || !end) return 'Dates TBD';
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  };

  const getDuration = () => {
    if (!retreat.start_date || !retreat.end_date) return 'Duration TBD';
    const start = parseDateOnly(retreat.start_date);
    const end = parseDateOnly(retreat.end_date);
    if (!start || !end) return 'Duration TBD';
    const days = Math.max(1, differenceInCalendarDays(end, start));
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const handleBookNow = async () => {
    // Require authentication to book
    if (!user) {
      // Store the retreat URL to redirect back after signup
      sessionStorage.setItem('bookingRedirect', `/retreat/${id}`);
      navigate('/signup', { state: { redirectTo: `/retreat/${id}` } });
      return;
    }

    setBookingLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (sessionData?.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('process-booking-payment', {
        body: {
          retreat_id: id,
          success_url: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/retreat/${id}`,
        },
        headers,
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Unable to start checkout. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Booking failed', { description: message });
    } finally {
      setBookingLoading(false);
    }
  };

  const hostName = (retreat as any).host_name || 'Retreat Host';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={() => navigate('/retreats/browse')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn(
                "h-4 w-4",
                isLiked ? "fill-red-500 stroke-red-500" : ""
              )} />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img 
          src={retreat.image} 
          alt={retreat.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            {retreat.retreat_type && (
              <Badge variant="secondary" className="mb-3 bg-white/90 text-foreground backdrop-blur-sm">
                {retreat.retreat_type}
              </Badge>
            )}
            <h1 
              className="text-3xl md:text-4xl font-bold text-white mb-2"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
            >
              {retreat.title}
            </h1>
            <div 
              className="flex flex-wrap items-center gap-4 text-white/90"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {retreat.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Info */}
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
              <Link to={retreat.host_user_id ? `/profile/${retreat.host_user_id}` : '#'}>
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {hostName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <Link 
                  to={retreat.host_user_id ? `/profile/${retreat.host_user_id}` : '#'}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {hostName}
                </Link>
              </div>
            </div>

            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">About this retreat</h2>
              <p className="text-muted-foreground leading-relaxed">
                {retreat.description || 'No description provided yet.'}
              </p>
            </section>

            <Separator />

            {/* Sample Itinerary */}
            {retreat.sample_itinerary && (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-6">Sample Itinerary</h2>
                  <ItineraryDisplay itinerary={retreat.sample_itinerary} />
                </section>
                <Separator />
              </>
            )}

            {/* What's Included */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">What's included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(retreat.amenities || []).map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Schedule */}
            {retreat.schedule && retreat.schedule.length > 0 && (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Daily schedule</h2>
                  <div className="space-y-3">
                    {retreat.schedule.map((item: { time: string; activity: string }, index: number) => (
                      <div key={index} className="flex gap-4 p-3 bg-card rounded-lg border border-border">
                        <span className="font-medium text-primary min-w-[80px]">{item.time}</span>
                        <span className="text-foreground">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* Reviews Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Reviews</h2>
              <div className="p-8 bg-accent/30 rounded-xl text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to experience this retreat!</p>
              </div>
            </section>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-lg">
              {/* Price */}
              <div className="mb-6">
                {retreat.price_per_person ? (
                  <>
                    <span className="text-3xl font-bold text-foreground">
                      ${retreat.price_per_person.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground"> / person</span>
                  </>
                ) : (
                  <span className="text-xl font-semibold text-muted-foreground">Price TBD</span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{formatDateRange()}</p>
                    <p className="text-sm text-muted-foreground">{getDuration()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{retreat.location}</span>
                </div>
                {retreat.max_attendees && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Users className={cn("h-5 w-5", isFull ? "text-destructive" : "text-primary")} />
                    <span className={isFull ? 'text-destructive font-medium' : ''}>
                      {isFull
                        ? 'Sold Out'
                        : spotsRemaining != null
                          ? `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining`
                          : `Up to ${retreat.max_attendees} attendees`}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* CTA Buttons */}
              <div className="space-y-3">
                {isFull ? (
                  isOnWaitlist ? (
                    <div className="space-y-2">
                      <p className="text-center text-sm font-medium text-muted-foreground">
                        You are #{waitlistEntry!.position} on the waitlist
                      </p>
                      <Button
                        variant="outline"
                        className="w-full rounded-full font-semibold"
                        size="lg"
                        onClick={() => leaveWaitlist.mutate(id!)}
                        disabled={leaveWaitlist.isPending}
                      >
                        Leave Waitlist
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full rounded-full font-semibold"
                      size="lg"
                      onClick={() => {
                        if (!user) {
                          sessionStorage.setItem('bookingRedirect', `/retreat/${id}`);
                          navigate('/signup', { state: { redirectTo: `/retreat/${id}` } });
                          return;
                        }
                        joinWaitlist.mutate(id!);
                      }}
                      disabled={joinWaitlist.isPending}
                    >
                      {joinWaitlist.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Joining waitlist...
                        </>
                      ) : (
                        'Join Waitlist'
                      )}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full rounded-full font-semibold"
                    size="lg"
                    onClick={handleBookNow}
                    disabled={bookingLoading || !retreat.price_per_person}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      'Reserve Spot'
                    )}
                  </Button>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {isFull
                  ? "We'll notify you if a spot opens up"
                  : 'Secure checkout powered by Stripe'}
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}