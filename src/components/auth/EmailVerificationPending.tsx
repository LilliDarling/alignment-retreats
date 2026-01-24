import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface EmailVerificationPendingProps {
  email: string;
  onBack?: () => void;
}

export default function EmailVerificationPending({ email, onBack }: EmailVerificationPendingProps) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    setResendSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('resend-verification-email', {
        body: { email },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResendSuccess(true);
      toast({
        title: 'Email sent!',
        description: 'A new verification email has been sent to your inbox.',
      });

      // Start 60 second cooldown
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back button */}
      <div className="p-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-accent">
                <Mail className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to
            </CardDescription>
            <p className="font-medium text-foreground mt-1">{email}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-foreground text-sm">What to do next:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open your email inbox</li>
                <li>Find the email from Alignment Retreats</li>
                <li>Click the verification link</li>
                <li>You'll be redirected to sign in</li>
              </ol>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or
              </p>
              
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={resending || cooldown > 0}
                className="w-full"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendSuccess && cooldown > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Sent! Resend in {cooldown}s
                  </>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Already verified?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
