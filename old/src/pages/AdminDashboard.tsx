import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { CSVExporter } from '@/components/admin/CSVExporter';
import CommandCenter from '@/components/admin/CommandCenter';
import RetreatBuilder from '@/components/admin/RetreatBuilder';
import SubmissionReview from '@/components/admin/SubmissionReview';
import PropertyReview from '@/components/admin/PropertyReview';
import WishesReview from '@/components/admin/WishesReview';
import ApprovedRetreats from '@/components/admin/ApprovedRetreats';
import NotificationBell from '@/components/admin/NotificationBell';
import { MemberDetailDrawer } from '@/components/admin/MemberDetailDrawer';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Calendar,
  Search,
  ArrowLeft,
  Shield,
  Home,
  Briefcase,
  Handshake,
  Heart,
  Download,
  BarChart3,
  Zap,
  Calculator,
  FileText,
  DollarSign,
  Wallet,
  UserCheck,
  Info
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MemberData {
  id: string;
  name: string | null;
  email: string;
  created_at: string | null;
  roles: string[];
}

const roleColors: Record<string, string> = {
  host: 'bg-primary/10 text-primary border-primary/20',
  cohost: 'bg-primary/8 text-primary/80 border-primary/15',
  landowner: 'bg-secondary text-secondary-foreground border-border',
  staff: 'bg-muted text-muted-foreground border-border',
  attendee: 'bg-secondary text-secondary-foreground border-secondary',
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  host: Users,
  cohost: Handshake,
  landowner: Home,
  staff: Briefcase,
  attendee: Heart,
  admin: Shield,
};

interface RevenueMetrics {
  pipelineValue: number;
  hostWealthIndex: number;
  capacityUtilization: number;
  availableCapacity: number;
  totalCapacity: number;
}

export default function AdminDashboard() {
  usePageTitle('Admin Dashboard');
  const { user } = useAuth();
  const location = useLocation();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('submissions');
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [pendingWishesCount, setPendingWishesCount] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    pipelineValue: 0,
    hostWealthIndex: 0,
    capacityUtilization: 0,
    availableCapacity: 0,
    totalCapacity: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Handle incoming state from submission review
  const submissionData = location.state?.submission;

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchMembers();
    fetchPendingCount();
    fetchPendingWishesCount();
    fetchRevenueMetrics();
  }, []);

  const fetchPendingWishesCount = async () => {
    try {
      const { count } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'attendee_wish')
        .eq('read', false);
      
      setPendingWishesCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending wishes count:', error);
    }
  };

  const fetchRevenueMetrics = async () => {
    try {
      // Fetch all retreats for pipeline value
      const { data: retreats } = await supabase
        .from('retreats')
        .select('price_per_person, max_attendees, host_user_id');

      // Calculate pipeline value (sum of price * attendees for all retreats)
      const pipelineValue = retreats?.reduce((sum, r) => {
        const price = r.price_per_person || 0;
        const attendees = r.max_attendees || 10; // Default to 10 if null
        return sum + (price * attendees);
      }, 0) || 0;

      // Get unique hosts count
      const uniqueHosts = new Set(retreats?.map(r => r.host_user_id)).size;
      const hostWealthIndex = uniqueHosts > 0 ? pipelineValue / uniqueHosts : 0;

      // Fetch total staff + cohosts
      const [{ count: staffCount }, { count: cohostCount }] = await Promise.all([
        supabase.from('staff_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cohosts').select('*', { count: 'exact', head: true }),
      ]);

      const totalCapacity = (staffCount || 0) + (cohostCount || 0);

      // Fetch unique team members currently assigned
      const { data: teamMembers } = await supabase
        .from('retreat_team')
        .select('user_id');

      const bookedCount = new Set(teamMembers?.map(t => t.user_id)).size;
      const availableCapacity = totalCapacity - bookedCount;
      const capacityUtilization = totalCapacity > 0 ? (bookedCount / totalCapacity) * 100 : 0;

      setRevenueMetrics({
        pipelineValue,
        hostWealthIndex,
        capacityUtilization,
        availableCapacity,
        totalCapacity,
      });
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_profiles_admin');

      if (error) {
        console.error('Error fetching profiles:', error);
        setMembers([]);
      } else {
        const transformedData: MemberData[] = (data || []).map((profile: any) => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          created_at: profile.created_at,
          roles: profile.roles || [],
        }));
        setMembers(transformedData);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const { count } = await supabase
        .from('retreats')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      
      setPendingSubmissionsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const filteredMembers = members.filter(member => 
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: members.length,
    thisWeek: members.filter(m => m.created_at && isAfter(new Date(m.created_at), subDays(new Date(), 7))).length,
    thisMonth: members.filter(m => m.created_at && isAfter(new Date(m.created_at), subDays(new Date(), 30))).length,
    byRole: {
      host: members.filter(m => m.roles.includes('host')).length,
      cohost: members.filter(m => m.roles.includes('cohost')).length,
      landowner: members.filter(m => m.roles.includes('landowner')).length,
      staff: members.filter(m => m.roles.includes('staff')).length,
      attendee: members.filter(m => m.roles.includes('attendee')).length,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground flex items-center gap-1 sm:gap-2">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage members, submissions, and analytics</p>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6">
        {/* Revenue Potential Header */}
        <TooltipProvider>
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Revenue Potential
              </CardTitle>
              <CardDescription>Live metrics to keep your eyes on the prize</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pipeline Value */}
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      Pipeline Value
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Total GMV if all retreats sell out (Price × Max Attendees)</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  {metricsLoading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      ${revenueMetrics.pipelineValue.toLocaleString()}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Total if sold out</p>
                </div>

                {/* Host Wealth Index */}
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      Host Wealth Index
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Average earning potential per host on the platform</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  {metricsLoading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      ${Math.round(revenueMetrics.hostWealthIndex).toLocaleString()}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Average per host</p>
                </div>

                {/* Capacity Utilization */}
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      Capacity Utilization
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Staff & cohosts currently assigned to retreats vs total available</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  {metricsLoading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {Math.round(revenueMetrics.capacityUtilization)}%
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {revenueMetrics.availableCapacity} of {revenueMetrics.totalCapacity} available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
            <TabsTrigger value="submissions" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm relative">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Submissions</span>
              {pendingSubmissionsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">
                  {pendingSubmissionsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="wishes" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm relative">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishes</span>
              {pendingWishesCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">
                  {pendingWishesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="matching" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">Matching</span>
            </TabsTrigger>
            <TabsTrigger value="command" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Command</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="exports" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exports</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <SubmissionReview />
          </TabsContent>

          <TabsContent value="properties">
            <PropertyReview />
          </TabsContent>

          <TabsContent value="wishes">
            <WishesReview />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.thisWeek}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.thisMonth}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Retreat Hosts</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.byRole.host}</div>
                </CardContent>
              </Card>
            </div>

            {/* Role Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Members by Role</CardTitle>
                <CardDescription>Distribution of member roles across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.byRole).map(([role, count]) => {
                    const Icon = roleIcons[role] || Users;
                    return (
                      <div key={role} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`p-2 rounded-full ${roleColors[role]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{role}s</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Members Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>All Members</CardTitle>
                    <CardDescription>View and search all registered members</CardDescription>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse text-muted-foreground">Loading members...</div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm ? 'No members found matching your search.' : 'No members found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.map((member) => (
                          <TableRow 
                            key={member.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setMemberDrawerOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">
                              {member.name || 'Unnamed'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.roles.map((role) => (
                                  <Badge 
                                    key={role} 
                                    variant="outline" 
                                    className={`text-xs ${roleColors[role] || ''}`}
                                  >
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.created_at 
                                ? format(new Date(member.created_at), 'MMM d, yyyy')
                                : 'Unknown'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exports">
            <CSVExporter />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="matching">
            <ApprovedRetreats />
          </TabsContent>

          <TabsContent value="command">
            <CommandCenter />
          </TabsContent>

          <TabsContent value="builder">
            <RetreatBuilder initialSubmission={submissionData} />
          </TabsContent>
        </Tabs>

        {/* Member Detail Drawer */}
        <MemberDetailDrawer
          memberId={selectedMemberId}
          open={memberDrawerOpen}
          onClose={() => {
            setMemberDrawerOpen(false);
            setSelectedMemberId(null);
          }}
        />
      </main>
    </div>
  );
}
