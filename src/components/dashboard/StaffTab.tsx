import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MyApplications from '@/components/dashboard/MyApplications';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  Calendar,
  Star,
  DollarSign,
  Search
} from 'lucide-react';

export default function StaffTab() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const content = (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
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
              <div className="p-3 rounded-xl bg-accent/10">
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
              <div className="p-3 rounded-xl bg-accent/10">
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

      {/* Find Work CTA */}
      <Card className="bg-muted border-0">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1 text-foreground">Looking for work?</h2>
            <p className="text-muted-foreground">Browse retreats that need your services.</p>
          </div>
          <Link to="/opportunities">
            <Button size="lg" className="whitespace-nowrap">
              <Search className="h-5 w-5 mr-2" />
              Find Opportunities
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">My Applications</CardTitle>
          <CardDescription>Track your retreat team applications</CardDescription>
        </CardHeader>
        <CardContent>
          <MyApplications
            emptyIcon={Briefcase}
            emptyTitle="No applications yet"
            emptyDescription="Connect with retreat organizers to find work opportunities"
          />
        </CardContent>
      </Card>
    </div>
  );

  return isAdmin ? content : <ComingSoonOverlay>{content}</ComingSoonOverlay>;
}
