import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Eye, Users, MousePointer, TrendingUp, Activity } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

interface AnalyticsEvent {
  id: string;
  event_name: string;
  event_category: string;
  session_id: string;
  user_id: string | null;
  page_path: string | null;
  created_at: string;
  metadata: Json;
}

interface DailyStats {
  date: string;
  pageViews: number;
  uniqueSessions: number;
  uniqueUsers: number;
}

interface EventBreakdown {
  name: string;
  count: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Format event names like "page_view" to "Page View"
const formatEventName = (name: string): string => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AnalyticsDashboard() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange));
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching analytics:', error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalPageViews = events.filter(e => e.event_name === 'page_view').length;
  const uniqueSessions = new Set(events.map(e => e.session_id)).size;
  const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;
  const totalInteractions = events.filter(e => e.event_category === 'interaction').length;

  // Daily stats for area chart
  const dailyStats: DailyStats[] = [];
  const daysCount = parseInt(dateRange);
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => 
      format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr
    );
    
    dailyStats.push({
      date: format(date, 'MMM d'),
      pageViews: dayEvents.filter(e => e.event_name === 'page_view').length,
      uniqueSessions: new Set(dayEvents.map(e => e.session_id)).size,
      uniqueUsers: new Set(dayEvents.filter(e => e.user_id).map(e => e.user_id)).size,
    });
  }

  // Event breakdown for pie chart
  const eventCounts: Record<string, number> = {};
  events.forEach(e => {
    eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
  });
  const eventBreakdown: EventBreakdown[] = Object.entries(eventCounts)
    .map(([name, count]) => ({ name: formatEventName(name), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top pages for bar chart
  const pageCounts: Record<string, number> = {};
  events.filter(e => e.event_name === 'page_view' && e.page_path).forEach(e => {
    const path = e.page_path || '/';
    pageCounts[path] = (pageCounts[path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .map(([path, views]) => ({ path: path.length > 20 ? path.slice(0, 20) + '...' : path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total page views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{uniqueSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Individual visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logged-in Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Authenticated users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interactions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clicks & form submits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Traffic Over Time
            </CardTitle>
            <CardDescription>Page views and unique sessions by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    name="Page Views"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueSessions" 
                    name="Unique Sessions"
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No page view data yet
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPages} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="path" 
                      width={100}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="views" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Types */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <CardDescription>Breakdown of tracked events</CardDescription>
          </CardHeader>
          <CardContent>
            {eventBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No event data yet
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {eventBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest tracked events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {events.slice(-20).reverse().map((event) => (
              <div 
                key={event.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatEventName(event.event_name)}</span>
                  {event.page_path && (
                    <span className="text-muted-foreground">{event.page_path}</span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(event.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events tracked yet. Visit some pages to see analytics!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
