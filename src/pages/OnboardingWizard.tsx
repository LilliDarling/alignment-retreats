import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Leaf, Users, Handshake, Home, Briefcase, Heart, Shield,
  ArrowRight, CheckCircle2, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const roleInfo: Record<AppRole, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  description: string;
  nextSteps: string[];
  ctaText: string;
}> = {
  host: {
    label: 'Retreat Host',
    icon: Users,
    description: 'You can create and manage retreats, connect with co-hosts and staff, and grow your retreat business.',
    nextSteps: [
      'Add your expertise areas and bio',
      'Create your first retreat',
      'Find venues and co-hosts'
    ],
    ctaText: 'Set up your host profile'
  },
  cohost: {
    label: 'Co-Host',
    icon: Handshake,
    description: 'You can collaborate with hosts, offer your skills, and help deliver amazing retreat experiences.',
    nextSteps: [
      'Add your skills and availability',
      'Set your hourly rate',
      'Browse host collaborations'
    ],
    ctaText: 'Complete your co-host profile'
  },
  landowner: {
    label: 'Landowner / Venue',
    icon: Home,
    description: 'You can list your property for retreats, connect with hosts, and earn from your beautiful space.',
    nextSteps: [
      'Add your property details',
      'Upload photos of your venue',
      'Set availability and pricing'
    ],
    ctaText: 'Add your first property'
  },
  staff: {
    label: 'Staff / Contractor',
    icon: Briefcase,
    description: 'You can offer your professional services to retreat organizers and build your client base.',
    nextSteps: [
      'Describe your services',
      'Set your rates and availability',
      'Add portfolio or credentials'
    ],
    ctaText: 'Set up your staff profile'
  },
  attendee: {
    label: 'Attendee',
    icon: Heart,
    description: 'You can discover transformative retreats, book experiences, and connect with like-minded people.',
    nextSteps: [
      'Complete your profile',
      'Browse upcoming retreats',
      'Save retreats you love'
    ],
    ctaText: 'Start exploring retreats'
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'You have full access to manage the platform, view members, and configure settings.',
    nextSteps: [
      'Review member signups',
      'Monitor platform activity',
      'Manage settings'
    ],
    ctaText: 'Go to admin dashboard'
  }
};

export default function OnboardingWizard() {
  usePageTitle('Welcome');
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || 'there';
  const primaryRole = userRoles[0] || 'attendee';
  const primaryRoleInfo = roleInfo[primaryRole];
  const PrimaryIcon = primaryRoleInfo.icon;

  const handleContinue = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      window.scrollTo(0, 0);
    } else {
      // Navigate to edit profile
      navigate('/profile/edit');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {currentStep === 0 ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/10 to-accent p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-background shadow-lg">
                        <Leaf className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl mb-2">
                      Welcome to Alignment Retreats, {userName}! 
                      <Sparkles className="inline-block ml-2 h-6 w-6 text-primary" />
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Your journey to transformative experiences begins now
                    </p>
                  </div>

                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h2 className="font-semibold text-lg mb-4">Your selected roles:</h2>
                      <div className="flex flex-wrap gap-3">
                        {userRoles.map((role) => {
                          const info = roleInfo[role];
                          const Icon = info.icon;
                          return (
                            <div 
                              key={role}
                              className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20"
                            >
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="font-medium">{info.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-8">
                      Let's set up your profile so you can get the most out of Alignment Retreats. 
                      This will only take a couple of minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleContinue} size="lg" className="flex-1">
                        Let's Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button onClick={handleSkip} variant="outline" size="lg">
                        Skip for now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="role-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-accent">
                        <PrimaryIcon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="font-display text-2xl">
                      As a {primaryRoleInfo.label}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {primaryRoleInfo.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Your next steps:</h3>
                      <div className="space-y-3">
                        {primaryRoleInfo.nextSteps.map((step, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg bg-accent/50"
                          >
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {userRoles.length > 1 && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">
                          You also have these roles:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {userRoles.slice(1).map((role) => {
                            const info = roleInfo[role];
                            const Icon = info.icon;
                            return (
                              <div 
                                key={role}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm"
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{info.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          You can set up these profiles from your Edit Profile page.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button onClick={handleContinue} size="lg" className="flex-1">
                        {primaryRoleInfo.ctaText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button onClick={handleSkip} variant="outline" size="lg">
                        I'll do this later
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1].map((step) => (
              <div 
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
