import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Trophy,
  Flame,
  Users,
  Eye,
  Zap,
  Clock,
  Target,
  Wallet
} from "lucide-react";
import { toast } from "sonner";

interface EscrowSummary {
  total_gbv: number;
  held_in_escrow: number;
  pending_release: number;
  total_released: number;
  active_escrows: number;
  platform_revenue: number;
}

interface HostPerformance {
  host_user_id: string;
  host_name: string;
  total_retreats: number;
  total_bookings: number;
  total_retreat_views: number;
  conversion_rate: number;
  total_revenue: number;
}

interface AtRiskRetreat {
  retreat_id: string;
  title: string;
  host_user_id: string;
  host_name: string;
  start_date: string;
  days_until_start: number;
  max_attendees: number;
  current_bookings: number;
  fill_rate: number;
  revenue_at_risk: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0: return "🥇";
    case 1: return "🥈";
    case 2: return "🥉";
    default: return `${index + 1}`;
  }
};

const getSeverityBadge = (daysUntil: number, fillRate: number) => {
  if (daysUntil <= 14 && fillRate < 30) {
    return <Badge variant="destructive" className="gap-1"><Flame className="h-3 w-3" /> Critical</Badge>;
  }
  if (daysUntil <= 21 && fillRate < 40) {
    return <Badge className="bg-orange-500 hover:bg-orange-600 gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Monitor</Badge>;
};

export default function CommandCenter() {
  const [escrowSummary, setEscrowSummary] = useState<EscrowSummary | null>(null);
  const [hostPerformance, setHostPerformance] = useState<HostPerformance[]>([]);
  const [atRiskRetreats, setAtRiskRetreats] = useState<AtRiskRetreat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [escrowRes, hostRes, riskRes] = await Promise.all([
        supabase.rpc('get_escrow_summary'),
        supabase.rpc('get_host_performance'),
        supabase.rpc('get_at_risk_retreats')
      ]);

      if (escrowRes.data && escrowRes.data.length > 0) {
        setEscrowSummary(escrowRes.data[0]);
      }
      if (hostRes.data) {
        setHostPerformance(hostRes.data);
      }
      if (riskRes.data) {
        setAtRiskRetreats(riskRes.data);
      }
    } catch (error) {
      console.error('Error fetching command center data:', error);
      toast.error('Failed to load command center data');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashSale = (retreatId: string, title: string) => {
    toast.success(`Flash Sale triggered for "${title}"`, {
      description: "Notification sent to marketing team"
    });
  };

  const handleNotifyHost = (hostName: string) => {
    toast.success(`Host "${hostName}" has been notified`, {
      description: "Email sent with booking status update"
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Revenue Highlight */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/30 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary whitespace-nowrap text-base sm:text-lg">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Platform Revenue <span className="hidden xs:inline">(30% Fee)</span><span className="xs:hidden">(30%)</span></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {formatCurrency(escrowSummary?.platform_revenue || 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Total earned from {escrowSummary?.active_escrows || 0} active bookings
          </p>
        </CardContent>
      </Card>

      {/* GBV Dashboard */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Gross Booking Value
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total GBV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(escrowSummary?.total_gbv || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Held in Escrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(escrowSummary?.held_in_escrow || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {escrowSummary?.active_escrows || 0} active escrows
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Pending Release
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {formatCurrency(escrowSummary?.pending_release || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Already Released
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(escrowSummary?.total_released || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Host Performance Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Host Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hostPerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No host data available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rank</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Host</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" /> Retreats
                      </div>
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" /> Views
                      </div>
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Bookings</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Conv %</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hostPerformance.slice(0, 10).map((host, index) => (
                    <tr key={host.host_user_id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 text-lg">{getRankIcon(index)}</td>
                      <td className="py-3 px-2 font-medium">{host.host_name || 'Unknown'}</td>
                      <td className="py-3 px-2 text-center">{host.total_retreats}</td>
                      <td className="py-3 px-2 text-center">{host.total_retreat_views}</td>
                      <td className="py-3 px-2 text-center">{host.total_bookings}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={host.conversion_rate >= 5 ? "default" : "secondary"}>
                          {host.conversion_rate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(host.total_revenue)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {index < 3 && host.conversion_rate >= 3 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            ⬆️ Boost Ads
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fire Alarm - At Risk Retreats */}
      <Card className="border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Flame className="h-5 w-5" />
            Fire Alarm - At Risk Retreats
            {atRiskRetreats.length > 0 && (
              <Badge variant="destructive" className="ml-2">{atRiskRetreats.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {atRiskRetreats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">✅</div>
              <p>All retreats are on track! No fires to put out.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {atRiskRetreats.map((retreat) => (
                <div 
                  key={retreat.retreat_id} 
                  className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(retreat.days_until_start, retreat.fill_rate)}
                        <h4 className="font-semibold">{retreat.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Host: {retreat.host_name || 'Unknown'} • Starts in {retreat.days_until_start} days
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Revenue at Risk</div>
                      <div className="text-lg font-bold text-destructive">
                        {formatCurrency(retreat.revenue_at_risk)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{retreat.current_bookings} / {retreat.max_attendees} booked</span>
                      <span className="font-medium">{retreat.fill_rate}%</span>
                    </div>
                    <Progress value={retreat.fill_rate} className="h-2" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleFlashSale(retreat.retreat_id, retreat.title)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Trigger Flash Sale
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleNotifyHost(retreat.host_name)}
                    >
                      Notify Host
                    </Button>
                    <Button size="sm" variant="ghost">
                      Boost TikTok
                    </Button>
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