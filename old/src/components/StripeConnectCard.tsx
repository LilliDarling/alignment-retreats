import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AccountStatus {
  status: 'not_connected' | 'onboarding' | 'active' | 'restricted';
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export function StripeConnectCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({ status: 'not_connected' });

  useEffect(() => {
    if (user) {
      checkAccountStatus();
    }
  }, [user]);

  const checkAccountStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { action: 'check_status' },
      });

      if (error) throw error;
      setAccountStatus(data);
    } catch (error) {
      console.error('Error checking account status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to connect your Stripe account.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { 
          action: 'create_account',
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to start Stripe onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleViewDashboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { action: 'create_login_link' },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to open Stripe dashboard.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Payout Account</CardTitle>
              <CardDescription>Connect your account to receive payments</CardDescription>
            </div>
          </div>
          {accountStatus.status === 'active' && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {accountStatus.status === 'onboarding' && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Incomplete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {accountStatus.status === 'not_connected' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to receive payouts from retreat bookings. 
              You'll receive 50% as a deposit immediately after booking and the remaining 50% one week before the retreat.
            </p>
            <Button onClick={handleConnectStripe} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </div>
        )}

        {accountStatus.status === 'onboarding' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your Stripe account setup is incomplete. Please complete the onboarding process to receive payouts.
            </p>
            <Button onClick={handleConnectStripe} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        )}

        {accountStatus.status === 'active' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {accountStatus.charges_enabled ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>Charges {accountStatus.charges_enabled ? 'enabled' : 'disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                {accountStatus.payouts_enabled ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>Payouts {accountStatus.payouts_enabled ? 'enabled' : 'disabled'}</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleViewDashboard}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Stripe Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
