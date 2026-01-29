import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { 
  Crown, 
  Users, 
  TreePine, 
  Wrench, 
  Heart,
  Leaf,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const roleOptions = [
  { 
    value: 'host' as AppRole, 
    label: 'Host', 
    icon: Crown, 
    description: 'Lead and organize retreats' 
  },
  { 
    value: 'cohost' as AppRole, 
    label: 'Co-Host', 
    icon: Users, 
    description: 'Assist in running retreats' 
  },
  { 
    value: 'landowner' as AppRole, 
    label: 'Landowner', 
    icon: TreePine, 
    description: 'Provide retreat venues' 
  },
  { 
    value: 'staff' as AppRole, 
    label: 'Staff', 
    icon: Wrench, 
    description: 'Support retreat operations' 
  },
  { 
    value: 'attendee' as AppRole, 
    label: 'Attendee', 
    icon: Heart, 
    description: 'Join and experience retreats' 
  },
];

const ComingSoon = () => {
  usePageTitle('Sign Up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const validation = signupSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    if (selectedRoles.length === 0) {
      toast({
        title: "Select at least one role",
        description: "Please tell us how you'd like to participate.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(
        email.trim().toLowerCase(),
        password,
        name.trim(),
        selectedRoles
      );

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast({
            title: "Account already exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive"
          });
        }
        setIsSubmitting(false);
        return;
      }

      // Fire off welcome emails (non-blocking)
      Promise.allSettled([
        supabase.functions.invoke('send-welcome-email', {
          body: { name: name.trim(), email: email.trim().toLowerCase() }
        }),
        supabase.functions.invoke('notify-new-member', {
          body: { 
            name: name.trim(), 
            email: email.trim().toLowerCase(), 
            userTypes: selectedRoles 
          }
        })
      ]).catch(() => {
        // Silently ignore email errors
      });

      toast({
        title: "Welcome to Alignment Retreats!",
        description: "Your account has been created successfully.",
      });

      // Redirect to onboarding
      navigate('/onboarding');
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-8">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Alignment Retreats
          </h1>
          <p className="text-xl text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">Sign up and tell us your role: host, landowner, staff, or attendee</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">Get matched with retreats, venues, or team members that fit your needs</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">Connect, collaborate, and create transformative retreat experiences</p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Your Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground text-center">
              I'm interested in... <span className="text-muted-foreground font-normal">(select all that apply)</span>
            </p>
            <div className="grid gap-2">
              {roleOptions.map((role) => {
                const isSelected = selectedRoles.includes(role.value);
                const Icon = role.icon;
                return (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                      isSelected 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground/50'
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground truncate">{role.label}</span>
                    <span className="text-xs text-muted-foreground truncate">— {role.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
