import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Search,
  Compass,
  Users,
  ArrowRight,
  Instagram,
  Linkedin,
  Facebook
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEO } from '@/components/SEO';
import VideoHeroSection from '@/components/VideoHeroSection';

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

  const getDashboardLink = () => {
    if (!user) return '/signup';
    if (hasRole('admin') && userRoles.length === 1) return '/admin';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Find Your Perfect Retreat"
        description="Discover transformative retreat experiences for alignment, wellness, and personal growth. Browse retreats, connect with hosts, and book your next experience."
        canonical="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Alignment Retreats',
          url: 'https://alignmentretreats.xyz',
          description: 'Transformative retreat experiences for alignment, wellness, and personal growth.',
        }}
      />
      {/* Announcement Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-accent text-accent-foreground py-2 px-2 sm:px-4"
      >
        <div className="container mx-auto text-center text-[11px] sm:text-sm whitespace-nowrap">
          <span>Want to host retreats in 2026?</span>
          <Link to="/get-started" className="font-semibold underline hover:opacity-80 ml-1 sm:ml-2">
            Join now
          </Link>
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
            <Link to="/retreats/browse">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-transform hover:scale-105"
              >
                <Compass className="mr-2 h-5 w-5" />
                Browse Retreats
              </Button>
            </Link>
            <Link to="/get-started">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-full bg-card/80 text-foreground hover:bg-accent hover:text-accent-foreground border-2 border-white/20 shadow-xl transition-all hover:scale-105"
              >
                <Users className="mr-2 h-5 w-5" />
                Collaborate
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Collaborate Section */}
      <section id="collaborate" className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection>
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-sm border border-border text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Collaborate with Alignment Retreats
              </h2>
              <div className="text-lg text-muted-foreground space-y-4 mb-8 max-w-2xl mx-auto">
                <p>
                  Alignment Retreats is a cooperative platform connecting retreat hosts, facilitators, venues, and collaborators.
                </p>
                <p>
                  You can join to host retreats, collaborate with others, or support retreats in different roles.
                </p>
                <p>
                  Select the roles you're interested in and create a simple profile to start collaborating.
                </p>
              </div>
              <Link to="/get-started">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full transition-transform hover:scale-105">
                  <Users className="mr-2 h-5 w-5" />
                  Collaborate
                </Button>
              </Link>
            </div>
          </AnimatedSection>
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
                    {user ? 'Go to Dashboard' : 'Start Collaborating'}
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
        <Link to="/retreats/browse" className="block">
          <Button className="w-full rounded-full font-semibold" size="lg">
            Browse Retreats
          </Button>
        </Link>
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
                <img src="/2tb.svg" alt="Alignment Retreats" className="w-10 h-10" />
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
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-4">
                <a href="https://www.instagram.com/alignment.retreats" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.facebook.com/people/Alignment-Retreats-Co-op/61587878720842/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/company/madc-foundation/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
              <p className="text-muted-foreground text-sm text-center">
                © 2026 Alignment Retreats. Bringing people together for transformative experiences.
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
