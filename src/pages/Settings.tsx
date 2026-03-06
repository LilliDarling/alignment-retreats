import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, KeyRound, Mail, Eye, EyeOff, Trash2, User, Shield } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Settings() {
  usePageTitle('Settings');
  const { user, userRoles, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toggles saving state
  const [directorySaving, setDirectorySaving] = useState(false);
  const [newsletterSaving, setNewsletterSaving] = useState(false);

  // Account deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('show_in_directory')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setShowInDirectory(data?.show_in_directory ?? true);

      // Fetch newsletter_opt_in separately (may not be in generated types yet)
      const { data: nlData } = await supabase
        .from('profiles')
        .select('newsletter_opt_in' as any)
        .eq('id', user.id)
        .single();

      setNewsletterOptIn((nlData as any)?.newsletter_opt_in ?? false);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});

    const validation = passwordSchema.safeParse({ password: newPassword, confirmPassword });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        errors[err.path[0] as string] = err.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDirectoryToggle = async (checked: boolean) => {
    setDirectorySaving(true);
    const previous = showInDirectory;
    setShowInDirectory(checked);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_in_directory: checked })
        .eq('id', user!.id);

      if (error) throw error;
      toast.success(checked ? 'You are now visible in the directory' : 'You are now hidden from the directory');
    } catch (error) {
      setShowInDirectory(previous);
      toast.error('Failed to update directory visibility');
    } finally {
      setDirectorySaving(false);
    }
  };

  const handleNewsletterToggle = async (checked: boolean) => {
    setNewsletterSaving(true);
    const previous = newsletterOptIn;
    setNewsletterOptIn(checked);

    try {
      // Update local profile flag
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ newsletter_opt_in: checked } as any)
        .eq('id', user!.id);

      if (dbError) throw dbError;

      // Sync with Mailchimp via edge function
      const { error: fnError } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email: user!.email,
          subscribe: checked,
          name: user!.user_metadata?.name || '',
        },
      });

      if (fnError) {
        console.error('Mailchimp sync error:', fnError);
        // Don't revert the DB flag — the preference is saved, Mailchimp sync can retry
      }

      toast.success(checked ? 'Subscribed to newsletter' : 'Unsubscribed from newsletter');
    } catch (error) {
      setNewsletterOptIn(previous);
      toast.error('Failed to update newsletter preference');
    } finally {
      setNewsletterSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user!.id },
      });

      if (error) throw error;

      toast.success('Account deleted successfully');
      await signOut();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showSignOut={!!user} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Roles</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {userRoles.map(role => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role === 'landowner' ? 'Venue Owner' : role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Member since</Label>
              <p className="text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.password && (
                <p className="text-sm text-destructive">{passwordErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !newPassword || !confirmPassword}
            >
              {passwordSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Visibility */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control your visibility and data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show in Directory</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other members to find your profile in the directory
                </p>
              </div>
              <Switch
                checked={showInDirectory}
                onCheckedChange={handleDirectoryToggle}
                disabled={directorySaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Newsletter / Mailchimp */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter
            </CardTitle>
            <CardDescription>Email communication preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Subscribe to Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about retreats, community news, and opportunities
                </p>
              </div>
              <Switch
                checked={newsletterOptIn}
                onCheckedChange={handleNewsletterToggle}
                disabled={newsletterSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions on your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <span className="block">
                      This action cannot be undone. This will permanently delete your account,
                      profile, and all associated data.
                    </span>
                    <span className="block font-medium">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="mt-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
