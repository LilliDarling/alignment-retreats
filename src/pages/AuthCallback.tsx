import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash which contains the tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some flows use these)
        const queryParams = new URLSearchParams(window.location.search);
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');

        if (errorParam) {
          setStatus('error');
          setErrorMessage(errorDescription || errorParam);
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          setStatus('success');

          const message = type === 'recovery'
            ? 'Password reset link verified. You can now set a new password.'
            : 'Your email has been verified successfully!';

          toast({
            title: type === 'recovery' ? 'Link Verified' : 'Email Verified',
            description: message,
          });

          // Check for stored redirect destination (from magic link with custom redirect)
          const storedRedirect = sessionStorage.getItem('authRedirectTo');
          const destination = storedRedirect || '/dashboard';
          sessionStorage.removeItem('authRedirectTo');

          // Redirect after a brief delay to show success
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 2000);
        } else {
          // No tokens found - check if already authenticated
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1000);
          } else {
            setStatus('error');
            setErrorMessage('No authentication tokens found. The link may have expired.');
          }
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/2tb.png" alt="Alignment Retreats" className="h-16 w-16" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying...</h1>
            <p className="text-muted-foreground">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
            <p className="text-muted-foreground mb-4">
              Your email has been verified successfully. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
