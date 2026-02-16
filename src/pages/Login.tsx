import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function Login() {
  usePageTitle('Sign In');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const stateRedirect = (location.state as { returnTo?: string; redirectTo?: string })?.returnTo
    || (location.state as { returnTo?: string; redirectTo?: string })?.redirectTo;
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const bookingRedirect = sessionStorage.getItem('bookingRedirect');
  const redirectPath = stateRedirect || from || bookingRedirect || '/dashboard';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Clear booking redirect from sessionStorage if it was used
    if (bookingRedirect) {
      sessionStorage.removeItem('bookingRedirect');
    }

    toast({
      title: 'Welcome back',
      description: 'You have successfully signed in.',
    });

    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 100);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = magicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setErrors({ email: validation.error.errors[0].message });
      return;
    }

    setLoading(true);

    const { error } = await signInWithMagicLink(email, redirectPath);

    if (error) {
      toast({
        title: 'Failed to send link',
        description: error.message === 'Signups not allowed for otp'
          ? 'No account found with this email. Please sign up first.'
          : error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setLoading(false);
  };

  const seo = (
    <SEO
      title="Sign In"
      description="Sign in to your Alignment Retreats account to manage your retreats, bookings, and profile."
      canonical="/login"
    />
  );

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {seo}
        <div className="p-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md border-border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-accent">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="font-display text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the link in the email to sign in. The link will expire in 1 hour.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
              >
                Use a different email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {seo}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/2tb.svg" alt="Alignment Retreats" className="h-20 w-20" />
            </div>
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Alignment Retreats account</CardDescription>
          </CardHeader>

          <CardContent>
            {useMagicLink ? (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setUseMagicLink(false)}
                >
                  Sign in with password
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setUseMagicLink(true)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Sign in with Magic Link
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
