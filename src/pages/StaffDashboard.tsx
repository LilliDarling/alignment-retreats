import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppHeader } from '@/components/AppHeader';
import { EarningsCalculator } from '@/components/EarningsCalculator';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Briefcase,
  Calendar,
  Star,
  DollarSign,
  Search
} from 'lucide-react';

export default function StaffDashboard() {
  usePageTitle('Staff Dashboard');
  const { userRoles, hasRole } = useAuth();
  const hasMultipleRoles = userRoles.length > 1;
  const isAdmin = hasRole('admin');

  const dashboardContent = (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Jobs</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Rating</p>
                <p className="text-2xl font-bold text-foreground">—</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-foreground">$0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Calculator */}
      <div className="mb-8">
        <EarningsCalculator defaultRole="staff" />
      </div>

      {/* Find Work CTA */}
      <Card className="mb-8 bg-muted border-0">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1 text-foreground">Looking for work?</h2>
            <p className="text-muted-foreground">Browse retreats that need your services.</p>
          </div>
          <Button size="lg" className="whitespace-nowrap">
            <Search className="h-5 w-5 mr-2" />
            Find Opportunities
          </Button>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">My Bookings</CardTitle>
          <CardDescription>Track your upcoming and past service work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex p-4 rounded-full bg-accent mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">Connect with retreat organizers to find work opportunities</p>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Browse Retreats
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {hasMultipleRoles && (
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-muted">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Staff Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage your service offerings and connect with retreat organizers.
          </p>
        </div>

        {isAdmin ? dashboardContent : <ComingSoonOverlay>{dashboardContent}</ComingSoonOverlay>}
      </main>
    </div>
  );
}
