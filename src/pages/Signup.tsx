import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import EmailVerificationPending from '@/components/auth/EmailVerificationPending';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, ArrowLeft, Handshake, Briefcase, Search, Check, Palette } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userTypes: z.array(z.string()).min(1, 'Select at least one role'),
});

const attendeeOption: { value: AppRole; label: string; description: string; icon: React.ElementType } = {
  value: 'attendee', label: 'Attendee', description: 'Discover and book retreats', icon: Search
};

const collaboratorOptions: { value: AppRole; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'host', label: 'Host', description: 'Lead your own retreats', icon: Users },
  { value: 'cohost', label: 'Co-Host / Facilitator', description: 'Partner with other hosts', icon: Handshake },
  { value: 'landowner', label: 'Venue Partner', description: 'List your property for retreats', icon: Home },
  { value: 'staff', label: 'Staff / Operations', description: 'Offer services like catering or wellness', icon: Briefcase },
];

// Creative/Marketing option - maps to 'staff' role in the backend
const creativeOption: { value: 'creative'; label: string; description: string; icon: React.ElementType } = {
  value: 'creative', label: 'Creative / Marketing', description: 'Design, content, and promotion', icon: Palette
};

function RoleCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background " +
        (checked ? "bg-primary text-primary-foreground" : "bg-background text-transparent")
      }
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

export default function Signup() {
  usePageTitle('Create Account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userTypes, setUserTypes] = useState<AppRole[]>([]);
  const [isCreativeSelected, setIsCreativeSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; userTypes?: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { trackFormSubmit, trackSignup } = useAnalytics();

  // Check for redirect URL in location state or sessionStorage (for booking flow)
  const stateRedirect = (location.state as { returnTo?: string; redirectTo?: string })?.returnTo
    || (location.state as { returnTo?: string; redirectTo?: string })?.redirectTo;
  const bookingRedirect = sessionStorage.getItem('bookingRedirect');
  const returnTo = stateRedirect || bookingRedirect;

  const toggleRole = (role: AppRole) => {
    setUserTypes(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Include creative as a valid role selection (maps to staff role)
    const effectiveUserTypes = isCreativeSelected
      ? (userTypes.includes('staff') ? userTypes : [...userTypes, 'staff' as AppRole])
      : userTypes;
    const validation = signupSchema.safeParse({ name, email, password, userTypes: effectiveUserTypes });
    if (!validation.success) {
      const fieldErrors: { name?: string; email?: string; password?: string; userTypes?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'userTypes') fieldErrors.userTypes = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Map creative selection to staff role for backend
      const rolesToSubmit = isCreativeSelected
        ? (userTypes.includes('staff') ? userTypes : [...userTypes, 'staff' as AppRole])
        : userTypes;
      const { error } = await signUp(email, password, name, rolesToSubmit);

      if (error) {
        let {message} = error;
        if (error.message.includes('already registered')) {
          message = 'An account with this email already exists. Please sign in instead.';
        }
        toast({
          title: 'Sign up failed',
          description: message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Track successful signup
      trackFormSubmit('signup');
      trackSignup('email', { roles: userTypes.join(','), email });

      supabase.functions.invoke('notify-new-member', {
        body: { name, email, roles: userTypes }
      });

      // Clear booking redirect from sessionStorage if it was used
      if (bookingRedirect) {
        sessionStorage.removeItem('bookingRedirect');
      }

      // Show email verification screen
      setSignupSuccess(true);
    } catch {
      toast({
        title: 'Sign up failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return <EmailVerificationPending email={email} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/2tb.png" alt="Alignment Retreats" className="h-12 w-12" />
            </div>
            <CardTitle className="font-display text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Choose how you'd like to participate in the retreat community
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-4">
                <Label>I want to...</Label>
                
                {/* Attendee Option */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Find Retreats</p>
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      userTypes.includes(attendeeOption.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                    onClick={() => toggleRole(attendeeOption.value)}
                  >
                    <RoleCheckbox checked={userTypes.includes(attendeeOption.value)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <attendeeOption.icon className="h-4 w-4 text-primary" />
                        <p className="font-medium">{attendeeOption.label}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{attendeeOption.description}</p>
                    </div>
                  </div>
                </div>

                {/* Collaborator Options */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Collaborate</p>
                  <div className="grid gap-3">
                    {collaboratorOptions.map((role) => (
                      <div
                        key={role.value}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          userTypes.includes(role.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        }`}
                        onClick={() => toggleRole(role.value)}
                      >
                        <RoleCheckbox checked={userTypes.includes(role.value)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <role.icon className="h-4 w-4 text-primary" />
                            <p className="font-medium">{role.label}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                    ))}
                    {/* Creative/Marketing Option */}
                    <div
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        isCreativeSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => setIsCreativeSelected(!isCreativeSelected)}
                    >
                      <RoleCheckbox checked={isCreativeSelected} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <creativeOption.icon className="h-4 w-4 text-primary" />
                          <p className="font-medium">{creativeOption.label}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{creativeOption.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {errors.userTypes && <p className="text-sm text-destructive">{errors.userTypes}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
