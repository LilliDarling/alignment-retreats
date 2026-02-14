import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Payout {
  id: string;
  amount: number;
  payout_type: string;
  scheduled_date: string;
  status: string;
  processed_at: string | null;
}

export function EarningsDashboard() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayouts();
    }
  }, [user]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_payouts')
        .select('*')
        .eq('recipient_user_id', user?.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'scheduled');
  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const totalEarned = completedPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'pending':
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Completed</Badge>;
      case 'pending':
      case 'scheduled':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Scheduled</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-2xl text-primary">
              ${totalEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payouts</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              ${totalPending.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payouts</CardDescription>
            <CardTitle className="text-2xl">{payouts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout History
          </CardTitle>
          <CardDescription>Track your earnings from retreat bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payouts yet</p>
              <p className="text-sm">Earnings from retreat bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div 
                  key={payout.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payout.status)}
                    <div>
                      <p className="font-medium text-foreground">
                        ${Number(payout.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {payout.payout_type} payment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {payout.processed_at 
                          ? format(new Date(payout.processed_at), 'MMM d, yyyy')
                          : format(new Date(payout.scheduled_date), 'MMM d, yyyy')
                        }
                      </p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
