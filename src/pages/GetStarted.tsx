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
import { Crown, Users, Home, Briefcase, ChevronLeft, ChevronRight, Check, Palette, MapPin, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SelectedRole = 'attendee' | 'host' | 'cohost' | 'landowner' | 'staff' | 'creative';

interface ProfileData {
  location: string;
  description: string;
  availability: string;
  coopInterest?: boolean;
}

const attendeeOption: { value: SelectedRole; label: string; description: string; icon: React.ReactNode } = {
  value: 'attendee', label: 'Attendee', description: 'Discover and book retreats', icon: <Search className="h-5 w-5" />
};

const collaboratorOptions: { value: SelectedRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'host', label: 'Host', description: 'Lead and organize retreats', icon: <Crown className="h-5 w-5" /> },
  { value: 'cohost', label: 'Co-Host / Facilitator', description: 'Support retreat leaders', icon: <Users className="h-5 w-5" /> },
  { value: 'landowner', label: 'Venue Partner', description: 'Offer your property', icon: <Home className="h-5 w-5" /> },
  { value: 'staff', label: 'Staff / Operations', description: 'Provide retreat services', icon: <Briefcase className="h-5 w-5" /> },
  { value: 'creative', label: 'Creative / Marketing', description: 'Design, content, and promotion', icon: <Palette className="h-5 w-5" /> },
];

type FlowStep = 'role-selection' | 'host-message' | 'profile-creation';

// Check if Host role is selected (show host-specific message)
const hasHostRole = (roles: SelectedRole[]) => roles.includes('host');

export default function GetStarted() {
  usePageTitle('Get Started');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>('role-selection');
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    location: '',
    description: '',
    availability: '',
    coopInterest: undefined,
  });

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

  const toggleRole = (role: SelectedRole) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleRoleSelectionContinue = () => {
    if (selectedRoles.length === 0) {
      toast({ title: 'Please select at least one role', variant: 'destructive' });
      return;
    }
    // If Host is selected, show host-specific message first
    if (hasHostRole(selectedRoles)) {
      setFlowStep('host-message');
    } else {
      setFlowStep('profile-creation');
    }
  };

  const handleHostMessageContinue = (coopInterest: boolean) => {
    setProfileData(prev => ({ ...prev, coopInterest }));
    if (coopInterest) {
      // Redirect to Co-Op page if interested
      navigate('/cooperative');
    } else {
      setFlowStep('profile-creation');
    }
  };

  const handleHostMessageBack = () => {
    setFlowStep('role-selection');
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

      // Build metadata with profile data
      const onboardingData = {
        profile: profileData,
      };

      // Map creative role to staff for the backend
      const mappedRoles = selectedRoles.map(role =>
        role === 'creative' ? 'staff' : role
      ) as AppRole[];

      const { error } = await signUp(email, password, name, mappedRoles, onboardingData);

      if (error) {
        let {message} = error;
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

      // Build completed fields from profile data
      const completedFields: string[] = [];
      if (profileData.location) completedFields.push(`Location: ${profileData.location}`);
      if (profileData.description) completedFields.push(`Description: ${profileData.description}`);
      if (profileData.availability) completedFields.push(`Availability: ${profileData.availability}`);

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
        description: 'Your profile has been set up. Welcome to Alignment Retreats!',
      });

      navigate('/thank-you');
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
              <img src="/2tb.svg" alt="Alignment Retreats" className="w-12 h-12" />
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
            <CardContent className="space-y-6">
              {/* Attendee Option */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Find Retreats</p>
                <button
                  type="button"
                  onClick={() => toggleRole(attendeeOption.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                    selectedRoles.includes(attendeeOption.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedRoles.includes(attendeeOption.value) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {attendeeOption.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{attendeeOption.label}</p>
                    <p className="text-sm text-muted-foreground">{attendeeOption.description}</p>
                  </div>
                  {selectedRoles.includes(attendeeOption.value) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              </div>

              {/* Collaborator Options */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Collaborate</p>
                <div className="space-y-3">
                  {collaboratorOptions.map(option => (
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
                </div>
              </div>

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

  // Render host message step
  if (flowStep === 'host-message') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/2tb.svg" alt="Alignment Retreats" className="w-12 h-12" />
              <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Hosting on Alignment Retreats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 text-muted-foreground space-y-3">
                <p>
                  Hosting retreats through Alignment Retreats is <span className="font-semibold text-foreground">open to everyone</span>.
                </p>
                <p>
                  If you'd like to participate as a co-founder in the Alignment Retreats Co-Op — including profit sharing and governance — you may choose to join the Co-Op Foundation separately.
                </p>
                <p className="text-sm">
                  <span className="font-medium text-foreground">Note:</span> Co-Op members don't pay deposit fees for their retreats.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleHostMessageContinue(false)}
                  className="w-full"
                >
                  Continue as Host
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleHostMessageContinue(true)}
                  className="w-full"
                >
                  Learn About Co-Op Co-Founder Membership
                </Button>
              </div>

              <div className="pt-2">
                <Button variant="ghost" onClick={handleHostMessageBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render profile creation step
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/2tb.svg" alt="Alignment Retreats" className="w-12 h-12" />
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Profile</CardTitle>
            <CardDescription>
              Tell us a bit about yourself to start collaborating.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="location">Location</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={e => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Show selected roles */}
              <div>
                <Label>Selected Roles</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRoles.map(role => {
                    const allOptions = [attendeeOption, ...collaboratorOptions];
                    const roleOption = allOptions.find(r => r.value === role);
                    return (
                      <span key={role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {roleOption?.label || role}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Short Description / Experience</Label>
                <Textarea
                  id="description"
                  value={profileData.description}
                  onChange={e => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your background and what you'd like to contribute..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="availability">Availability or Interests</Label>
                <Input
                  id="availability"
                  value={profileData.availability}
                  onChange={e => setProfileData(prev => ({ ...prev, availability: e.target.value }))}
                  placeholder="e.g., Weekends, Summer 2026, Flexible..."
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

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (hasHostRole(selectedRoles)) {
                      setFlowStep('host-message');
                    } else {
                      setFlowStep('role-selection');
                    }
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
