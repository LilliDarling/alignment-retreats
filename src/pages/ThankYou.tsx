import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, CheckCircle, Compass, ArrowRight, Crown, ExternalLink, Home, Ticket, Calendar, PartyPopper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CALENDLY_COOP_ONBOARDING_URL } from '@/config/constants';

export default function ThankYou() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check if this is a booking confirmation (has session_id from Stripe)
  const sessionId = searchParams.get('session_id');
  const isBookingConfirmation = !!sessionId;

  usePageTitle(isBookingConfirmation ? 'Booking Confirmed' : 'Welcome');

  const userName = user?.user_metadata?.name || 'there';
  const coopInterest = location.state?.coopInterest;

  // Check if user came from trying to book a retreat (only relevant for signup flow)
  const bookingRedirect = isBookingConfirmation ? null : sessionStorage.getItem('bookingRedirect');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-lg border-border text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                {isBookingConfirmation ? (
                  <PartyPopper className="h-16 w-16 text-primary" />
                ) : (
                  <CheckCircle className="h-16 w-16 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="font-display text-3xl mb-2">
              {isBookingConfirmation
                ? `Booking Confirmed!`
                : `Thanks for signing up, ${userName}!`}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {isBookingConfirmation ? (
              <>
                <p className="text-muted-foreground text-lg">
                  Your retreat has been booked successfully. We can't wait to see you there!
                </p>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        What happens next?
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                          <span>You'll receive a confirmation email with your booking details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                          <span>The retreat host will reach out with more information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                          <span>Get ready for a transformative experience!</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Link to="/retreats/browse">
                    <Button size="lg" className="w-full rounded-full">
                      <Compass className="mr-2 h-5 w-5" />
                      Browse More Retreats
                    </Button>
                  </Link>

                  <Link to="/">
                    <Button size="lg" variant="ghost" className="w-full rounded-full">
                      <Home className="mr-2 h-5 w-5" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-lg">
                  We're excited to have you join the Alignment Retreats community.
                  Our team will be in touch shortly to help you get started.
                </p>

                {/* Co-op CTA for interested users */}
                {coopInterest && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-left">
                    <div className="flex items-start gap-3">
                      <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">
                          Ready to become a founding member?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Schedule a call to learn more about the co-op, discuss membership tiers,
                          and start your journey as a co-owner.
                        </p>
                        <a
                          href={CALENDLY_COOP_ONBOARDING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                            <Crown className="mr-2 h-4 w-4" />
                            Schedule Co-Op Onboarding Call
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-accent/50 rounded-lg p-6 text-left">
                  <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <span>We'll review your profile and reach out within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <span>You'll get access to connect with other collaborators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <span>Start planning your first retreat together</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 space-y-3">
                  {/* Show Continue to Book button if user came from booking flow */}
                  {bookingRedirect && (
                    <Link to={bookingRedirect} onClick={() => sessionStorage.removeItem('bookingRedirect')}>
                      <Button size="lg" className="w-full rounded-full">
                        <Ticket className="mr-2 h-5 w-5" />
                        Continue to Book
                      </Button>
                    </Link>
                  )}

                  {/* Browse Retreats button */}
                  <Link to="/retreats/browse">
                    <Button size="lg" variant={bookingRedirect ? "outline" : "default"} className="w-full rounded-full">
                      <Compass className="mr-2 h-5 w-5" />
                      Browse Retreats
                    </Button>
                  </Link>

                  {/* Home button */}
                  <Link to="/">
                    <Button size="lg" variant="ghost" className="w-full rounded-full">
                      <Home className="mr-2 h-5 w-5" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
