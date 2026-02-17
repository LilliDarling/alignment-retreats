import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function Donate() {
  usePageTitle('Donate');
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const activeAmount = selectedPreset ?? (parseFloat(customAmount) || 0);

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
  };

  const handleDonate = async () => {
    if (activeAmount < 1) {
      toast.error('Please enter a donation amount of at least $1');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (sessionData?.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('process-donation', {
        body: {
          amount: activeAmount,
          success_url: `${window.location.origin}/donate?success=true`,
          cancel_url: `${window.location.origin}/donate`,
        },
        headers,
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Unable to start checkout. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Donation failed', { description: message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Thank You!</h1>
          <p className="text-muted-foreground text-lg">
            Your donation has been received. Thank you for supporting Alignment Retreats!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Support Alignment Retreats</CardTitle>
            <CardDescription className="text-base">
              Your donation helps us build community, support retreat hosts, and make transformative experiences accessible to more people.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedPreset === amount ? 'default' : 'outline'}
                  onClick={() => handlePresetClick(amount)}
                  className="text-lg font-semibold"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Or enter a custom amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="pl-7 text-lg"
                  min={1}
                  max={10000}
                />
              </div>
            </div>

            {/* Donate button */}
            <Button
              onClick={handleDonate}
              disabled={activeAmount < 1 || loading}
              className="w-full rounded-full font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Donate {activeAmount >= 1 ? `$${activeAmount.toLocaleString()}` : ''}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secure checkout powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
