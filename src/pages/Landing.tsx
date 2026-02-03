import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Leaf,
  Search,
  Compass,
  Users,
  ArrowRight,
  ChevronRight,
  Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { RetreatCard } from '@/components/RetreatCard';
import { supabase } from '@/integrations/supabase/client';
import VideoHeroSection from '@/components/VideoHeroSection';
import { CALENDLY_BOOK_CALL_URL } from '@/config/constants';

// Animated section wrapper
const AnimatedSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Landing() {
  usePageTitle('Find Your Perfect Retreat');
  const { user, userRoles, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch real published retreats from database with property info
  const { data: retreats = [], isLoading } = useQuery({
    queryKey: ['published-retreats-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      const retreats = (data || []) as any[];
      const hostIds = Array.from(
        new Set(retreats.map((r) => r.host_user_id).filter(Boolean))
      );

      if (hostIds.length === 0) return retreats;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', hostIds);

      if (profilesError) return retreats;

      const nameById = new Map((profiles || []).map((p) => [p.id, p.name]));
      return retreats.map((r) => ({
        ...r,
        host_profile_name: nameById.get(r.host_user_id) || null,
      }));
    },
  });

  const getDashboardLink = () => {
    if (!user) return '/signup';
    if (userRoles.length > 1) return '/dashboard';
    if (hasRole('host')) return '/dashboard/host';
    if (hasRole('cohost')) return '/dashboard/cohost';
    if (hasRole('landowner')) return '/dashboard/landowner';
    if (hasRole('staff')) return '/dashboard/staff';
    if (hasRole('attendee')) return '/dashboard/attendee';
    if (hasRole('admin')) return '/admin';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary text-primary-foreground py-2 px-2 sm:px-4"
      >
        <div className="container mx-auto text-center text-[11px] sm:text-sm whitespace-nowrap">
          <span>USD at $1.40 CAD — great time to book!</span>
          <a href="#retreats" className="font-semibold underline hover:opacity-80 ml-1 sm:ml-2">
            Reserve
          </a>
        </div>
      </motion.div>

      {/* Hero Section with Full Background */}
      <section className="relative h-[75vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <VideoHeroSection />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-sans text-5xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight"
          >
            Align With Your<br className="md:hidden" /> Perfect Retreat
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-lg md:text-lg text-white/80 max-w-xl mx-auto mb-8 font-medium"
          >
            Host, Discover, and Thrive Together
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col sm:flex-row justify-center gap-4 mt-10"
          >
            <a href="#retreats">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-transform hover:scale-105"
              >
                <Compass className="mr-2 h-5 w-5" />
                Reserve Spot
              </Button>
            </a>
            <a href={CALENDLY_BOOK_CALL_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-full bg-card/80 text-foreground hover:bg-card border-2 border-white/20 shadow-xl transition-transform hover:scale-105"
              >
                <Phone className="mr-2 h-5 w-5" />
                Book a Call
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Featured Retreats */}
      <section id="retreats" className="py-8 md:py-12 px-4 scroll-mt-24">
        <div className="container mx-auto max-w-7xl">
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Discover Retreats
              </h2>
              <Link to="/retreats/browse">
                <Button variant="ghost" size="sm" className="gap-1 px-0 sm:px-3">
                  View all <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] rounded-xl bg-accent mb-3" />
                  <div className="h-4 bg-accent rounded w-3/4 mb-2" />
                  <div className="h-4 bg-accent rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && retreats.length === 0 && (
            <AnimatedSection delay={0.1}>
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <div className="inline-flex p-4 rounded-full bg-accent mb-4">
                  <Leaf className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Retreats Coming Soon
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our community is working on amazing retreat experiences. Be the first to host or join one!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/signup">
                    <Button className="rounded-full">Become a Host</Button>
                  </Link>
                  <Link to="/retreats/browse">
                    <Button variant="outline" className="rounded-full">Browse Retreats</Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Retreat Grid */}
          {!isLoading && retreats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {retreats.map((retreat, index) => (
                <motion.div
                  key={retreat.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <RetreatCard
                    id={retreat.id}
                    title={retreat.title}
                    location={retreat.location || 'Location TBD'}
                    image="https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop"
                    startDate={retreat.start_date || ''}
                    endDate={retreat.end_date || ''}
                    pricePerPerson={retreat.price_per_person || 0}
                    retreatType={retreat.retreat_type || 'Retreat'}
                    maxAttendees={retreat.max_attendees || undefined}
                    hostName={(retreat as any).host_profile_name || undefined}
                    sampleItinerary={(retreat as any).sample_itinerary}
                    onClick={() => navigate(`/retreat/${retreat.id}`)}
                    onBook={() => navigate(`/retreat/${retreat.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              How Alignment Retreats Works
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Attendees */}
            <AnimatedSection delay={0.1}>
              <div className="bg-background rounded-2xl p-8 shadow-sm border border-border h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    For Retreat Seekers
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { step: '1', text: 'Discover retreats that match your interests' },
                    { step: '2', text: 'Book your spot securely' },
                    { step: '3', text: 'Experience transformation' },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.step} 
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                        {item.step}
                      </div>
                      <p className="text-muted-foreground pt-1">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
                <Link to="/retreats/browse" className="block mt-6">
                  <Button className="w-full rounded-full transition-transform hover:scale-[1.02]">
                    Browse Retreats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* For Hosts/Collaborators */}
            <AnimatedSection delay={0.2}>
              <div className="bg-background rounded-2xl p-8 shadow-sm border border-border h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    For Hosts & Collaborators
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { step: '1', text: 'Create your retreat or list your skills' },
                    { step: '2', text: 'Connect with co-hosts, venues & staff' },
                    { step: '3', text: 'Bring your vision to life' },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.step} 
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                        {item.step}
                      </div>
                      <p className="text-muted-foreground pt-1">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
                <Link to={user ? getDashboardLink() : '/signup'} className="block mt-6">
                  <Button variant="outline" className="w-full rounded-full transition-transform hover:scale-[1.02]">
                    {user ? 'Go to Dashboard' : 'Start Hosting'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection className="py-16 px-4 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4"
          >
            Ready to Begin Your Journey?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto"
          >
            Whether you're seeking transformation or creating it, Alignment Retreats is your platform.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/retreats/browse">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 rounded-full transition-transform hover:scale-105"
              >
                Explore Retreats
              </Button>
            </Link>
            <Link to={user ? getDashboardLink() : '/get-started'}>
              <Button 
                size="lg" 
                className="text-lg px-8 rounded-full bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-transform hover:scale-105"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-sm border-t border-border md:hidden">
        <a href="#retreats" className="block">
          <Button className="w-full rounded-full font-semibold" size="lg">
            Reserve Your Spot
          </Button>
        </a>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 px-4 border-t border-border bg-card pb-24 md:pb-12"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-foreground">Alignment Retreats</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                {user ? (
                  <>
                    <Link to={getDashboardLink()}>
                      <Button size="sm" className="rounded-full">Dashboard</Button>
                    </Link>
                    <button 
                      onClick={() => signOut()}
                      className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="sm" className="rounded-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground text-sm text-center">
                © 2024 Alignment Retreats. Bringing people together for transformative experiences.
              </p>
              <a 
                href="https://madcfoundation.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                A project of the MADC Foundation
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
