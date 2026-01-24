import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Handshake, 
  Home, 
  Briefcase, 
  Heart,
  ArrowRight,
  Plus,
  Shield
} from 'lucide-react';

const roleConfig: Record<AppRole, { label: string; description: string; icon: React.ElementType; href: string; color: string }> = {
  host: {
    label: 'Host Dashboard',
    description: 'Manage your retreats and bookings',
    icon: Users,
    href: '/dashboard/host',
    color: 'bg-primary/10 text-primary',
  },
  cohost: {
    label: 'Co-Host Dashboard',
    description: 'View collaborations and opportunities',
    icon: Handshake,
    href: '/dashboard/cohost',
    color: 'bg-secondary/10 text-secondary',
  },
  landowner: {
    label: 'Landowner Dashboard',
    description: 'Manage your properties and listings',
    icon: Home,
    href: '/dashboard/landowner',
    color: 'bg-accent text-accent-foreground',
  },
  staff: {
    label: 'Staff Dashboard',
    description: 'Track your service bookings',
    icon: Briefcase,
    href: '/dashboard/staff',
    color: 'bg-muted text-muted-foreground',
  },
  attendee: {
    label: 'Attendee Dashboard',
    description: 'View your booked retreats',
    icon: Heart,
    href: '/dashboard/attendee',
    color: 'bg-destructive/10 text-destructive',
  },
  admin: {
    label: 'Admin Dashboard',
    description: 'Manage members and platform',
    icon: Shield,
    href: '/admin',
    color: 'bg-red-500/10 text-red-600',
  },
};

export default function Dashboard() {
  const { userRoles, loading, hasRole, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole('admin');

  // Check for pending dream retreat data and redirect to complete submission
  useEffect(() => {
    if (!loading && user) {
      const pendingRetreat = localStorage.getItem('pendingDreamRetreat');
      if (pendingRetreat) {
        navigate('/build-retreat');
      }
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const dashboardContent = (
    <>
      {userRoles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {userRoles.map((role) => {
            const config = roleConfig[role];
            return (
              <Link key={role} to={config.href}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${config.color}`}>
                        <config.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-lg">{config.label}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full group-hover:bg-accent">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mt-8 bg-primary text-primary-foreground border-0">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold mb-1">Quick Actions</h2>
            <p className="text-primary-foreground/80">Jump right into what you need to do</p>
          </div>
          <div className="flex gap-3">
            <Link to="/retreats/browse">
              <Button className="bg-white text-primary hover:bg-white/90">
                Browse Retreats
              </Button>
            </Link>
            {userRoles.includes('host') && (
              <Link to="/retreats/create">
                <Button variant="outline" className="gap-2 border-white text-white bg-transparent hover:bg-white/10">
                  <Plus className="h-4 w-4" />
                  Create Retreat
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-muted-foreground">
            {userRoles.length > 1 
              ? 'You have multiple roles. Select which dashboard you\'d like to access.'
              : 'Start by submitting a retreat idea or browsing available retreats.'}
          </p>
        </div>

        {isAdmin ? dashboardContent : <ComingSoonOverlay>{dashboardContent}</ComingSoonOverlay>}
      </main>
    </div>
  );
}
