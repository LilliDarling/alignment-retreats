import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Crown, Users, Home, Briefcase, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { HostOnboarding } from '@/components/onboarding/HostOnboarding';
import { CohostOnboarding } from '@/components/onboarding/CohostOnboarding';
import { StaffOnboarding } from '@/components/onboarding/StaffOnboarding';
import { LandownerOnboarding, LandownerOnboardingData } from '@/components/onboarding/LandownerOnboarding';
import { CoopQuestionStep } from '@/components/onboarding/CoopQuestionStep';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type CollaboratorRole = 'host' | 'cohost' | 'landowner' | 'staff';

interface OnboardingData {
  host?: { expertiseAreas: string[]; minRate: number; maxRate: number };
  cohost?: { skills: string[]; availability: string; hourlyRate: number; minRate: number; maxRate: number };
  staff?: { serviceType: string; experienceYears: number; dayRate: number; availability: string; portfolioUrl: string };
  landowner?: LandownerOnboardingData;
  coopInterest?: boolean;
}

const roleOptions: { value: CollaboratorRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'host', label: 'Host', description: 'Lead and organize retreats', icon: <Crown className="h-5 w-5" /> },
  { value: 'cohost', label: 'Co-Host', description: 'Support retreat leaders', icon: <Users className="h-5 w-5" /> },
  { value: 'landowner', label: 'Venue Owner', description: 'Offer your property', icon: <Home className="h-5 w-5" /> },
  { value: 'staff', label: 'Staff', description: 'Provide retreat services', icon: <Briefcase className="h-5 w-5" /> },
];

type FlowStep = 'role-selection' | 'coop-question' | 'role-onboarding' | 'account-creation';

// Check if selected roles require co-op question (host or landowner)
const needsCoopQuestion = (roles: CollaboratorRole[]) => 
  roles.includes('host') || roles.includes('landowner');

export default function GetStarted() {
  usePageTitle('Get Started');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>('role-selection');
  const [selectedRoles, setSelectedRoles] = useState<CollaboratorRole[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  // Account form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const toggleRole = (role: CollaboratorRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleRoleSelectionContinue = () => {
    if (selectedRoles.length === 0) {
      toast({ title: 'Please select at least one role', variant: 'destructive' });
      return;
    }
    // If host or landowner selected, show co-op question first
    if (needsCoopQuestion(selectedRoles)) {
      setFlowStep('coop-question');
    } else {
      setCurrentRoleIndex(0);
      setFlowStep('role-onboarding');
    }
  };

  const handleCoopQuestionComplete = (interested: boolean) => {
    setOnboardingData(prev => ({ ...prev, coopInterest: interested }));
    setCurrentRoleIndex(0);
    setFlowStep('role-onboarding');
  };

  const handleCoopQuestionBack = () => {
    setFlowStep('role-selection');
  };

  const handleRoleOnboardingComplete = (role: CollaboratorRole, data: any) => {
    setOnboardingData(prev => ({ ...prev, [role]: data }));
    
    // Move to next role or account creation
    if (currentRoleIndex < selectedRoles.length - 1) {
      setCurrentRoleIndex(prev => prev + 1);
    } else {
      setFlowStep('account-creation');
    }
  };

  const handleRoleOnboardingBack = () => {
    if (currentRoleIndex > 0) {
      setCurrentRoleIndex(prev => prev - 1);
    } else if (needsCoopQuestion(selectedRoles)) {
      // Go back to co-op question if applicable
      setFlowStep('coop-question');
    } else {
      setFlowStep('role-selection');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = signupSchema.safeParse({ name, email, password });
      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Build metadata with all onboarding data
      const { error } = await signUp(email, password, name, selectedRoles as AppRole[], onboardingData);

      if (error) {
        let message = error.message;
        if (message.includes('already registered')) {
          message = 'An account with this email already exists. Please sign in instead.';
        }
        toast({ title: 'Signup failed', description: message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Send admin notification for new member (don't block on this)
      supabase.functions.invoke('notify-new-member', {
        body: { name, email, roles: selectedRoles }
      }).catch((error) => {
        console.error('Admin notification failed:', error);
      });

      // Build completed fields from onboarding data
      const completedFields: string[] = [];
      if (onboardingData.host) {
        completedFields.push(`Host Expertise: ${onboardingData.host.expertiseAreas.join(', ')}`);
        completedFields.push(`Host Rate: $${onboardingData.host.minRate} - $${onboardingData.host.maxRate}`);
      }
      if (onboardingData.cohost) {
        completedFields.push(`Co-Host Skills: ${onboardingData.cohost.skills.join(', ')}`);
        completedFields.push(`Co-Host Daily Rate: $${onboardingData.cohost.hourlyRate || onboardingData.cohost.minRate}`);
      }
      if (onboardingData.staff) {
        completedFields.push(`Staff Service: ${onboardingData.staff.serviceType}`);
        completedFields.push(`Staff Experience: ${onboardingData.staff.experienceYears} years`);
        completedFields.push(`Staff Day Rate: $${onboardingData.staff.dayRate}`);
      }
      if (onboardingData.landowner) {
        completedFields.push(`Property: ${onboardingData.landowner.propertyName}`);
        completedFields.push(`Property Type: ${onboardingData.landowner.propertyType}`);
        if (onboardingData.landowner.location) completedFields.push(`Location: ${onboardingData.landowner.location}`);
        if (onboardingData.landowner.basePrice) completedFields.push(`Base Price: $${onboardingData.landowner.basePrice}/night`);
      }
      if (onboardingData.coopInterest !== undefined) {
        completedFields.push(`Co-op Interest: ${onboardingData.coopInterest ? 'Yes - Interested in joining' : 'No - Will pay venue deposits'}`);
      }

      // Send profile completion notification with all the collected data
      supabase.functions.invoke('notify-profile-completed', {
        body: { 
          name, 
          email, 
          roles: selectedRoles,
          completedFields 
        }
      }).catch((error) => {
        console.error('Profile completion notification failed:', error);
      });

      toast({
        title: 'Account created!',
        description: onboardingData.coopInterest 
          ? 'Your profile has been set up. Schedule a call to discuss co-op membership!'
          : 'Your profile has been set up with your preferences.',
      });

      // If co-op interested, navigate to thank you with co-op flag
      navigate('/thank-you', { 
        state: { coopInterest: onboardingData.coopInterest } 
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Render role selection step
  if (flowStep === 'role-selection') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">How do you want to contribute?</CardTitle>
              <CardDescription>
                Select one or more roles. We'll ask a few questions to set up your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roleOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleRole(option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                    selectedRoles.includes(option.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedRoles.includes(option.value) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {selectedRoles.includes(option.value) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}

              <div className="pt-4 flex justify-between">
                <Link to="/">
                  <Button variant="ghost">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <Button onClick={handleRoleSelectionContinue} disabled={selectedRoles.length === 0}>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground pt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render co-op question step
  if (flowStep === 'coop-question') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <CoopQuestionStep
            onComplete={handleCoopQuestionComplete}
            onBack={handleCoopQuestionBack}
            initialValue={onboardingData.coopInterest}
          />
        </div>
      </div>
    );
  }

  // Render role-specific onboarding
  if (flowStep === 'role-onboarding') {
    const currentRole = selectedRoles[currentRoleIndex];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
            </Link>
            <span className="text-sm text-muted-foreground">
              Setting up: {selectedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
            </span>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            {currentRole === 'host' && (
              <HostOnboarding
                onComplete={(data) => handleRoleOnboardingComplete('host', data)}
                onBack={handleRoleOnboardingBack}
                initialData={onboardingData.host}
              />
            )}
            {currentRole === 'cohost' && (
              <CohostOnboarding
                onComplete={(data) => handleRoleOnboardingComplete('cohost', data)}
                onBack={handleRoleOnboardingBack}
                initialData={onboardingData.cohost}
              />
            )}
            {currentRole === 'staff' && (
              <StaffOnboarding
                onComplete={(data) => handleRoleOnboardingComplete('staff', data)}
                onBack={handleRoleOnboardingBack}
              />
            )}
            {currentRole === 'landowner' && (
              <LandownerOnboarding
                onComplete={(data) => handleRoleOnboardingComplete('landowner', data)}
                onBack={handleRoleOnboardingBack}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render account creation step
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Almost done! Your profile preferences are ready to be saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1"
                />
              </div>

              {/* Show selected roles summary */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium text-foreground mb-2">Your Profile</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.map(role => (
                    <span key={role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your preferences and rates are ready to be saved
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentRoleIndex(selectedRoles.length - 1);
                    setFlowStep('role-onboarding');
                  }}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
