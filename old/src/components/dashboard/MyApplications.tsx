import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Handshake,
  Briefcase,
  Home,
  ChefHat,
  DollarSign,
  Search,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';

interface Application {
  id: string;
  role: string;
  fee_amount: number;
  fee_type: string;
  agreed: boolean;
  agreed_at: string | null;
  created_at: string;
  retreat: {
    title: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
  } | null;
}

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cohost: Handshake,
  venue: Home,
  chef: ChefHat,
  staff: Briefcase,
};

const roleLabels: Record<string, string> = {
  host: 'Host',
  cohost: 'Co-Host',
  venue: 'Venue',
  chef: 'Chef',
  staff: 'Staff',
  other: 'Other',
};

function feeLabel(feeType: string): string {
  switch (feeType) {
    case 'per_person': return '/person';
    case 'per_night': return '/night';
    case 'per_person_per_night': return '/person/night';
    case 'flat': return ' flat';
    case 'percentage': return '%';
    default: return '';
  }
}

interface MyApplicationsProps {
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function MyApplications({
  emptyIcon: EmptyIcon = Handshake,
  emptyTitle = 'No applications yet',
  emptyDescription = 'Browse opportunities to find retreats looking for your skills',
}: MyApplicationsProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchApplications() {
      const { data, error } = await supabase
        .from('retreat_team')
        .select(`
          id,
          role,
          fee_amount,
          fee_type,
          agreed,
          agreed_at,
          created_at,
          retreats (
            title,
            start_date,
            end_date,
            status
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
      } else if (data) {
        setApplications(data.map(d => ({
          ...d,
          retreat: d.retreats as Application['retreat'],
        })));
      }
      setLoading(false);
    }

    fetchApplications();
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex p-4 rounded-full bg-accent/10 mb-4">
          <EmptyIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground mb-4">{emptyDescription}</p>
        <Link to="/opportunities">
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Browse Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const Icon = roleIcons[app.role] || Briefcase;
        return (
          <div
            key={app.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {app.retreat?.title || 'Retreat'}
                  </h4>
                  <Badge variant={app.agreed ? 'default' : 'secondary'} className="text-xs">
                    {app.agreed ? 'Accepted' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{roleLabels[app.role] || app.role}</span>
                  <span className="flex items-center gap-0.5">
                    <DollarSign className="h-3 w-3" />
                    {app.fee_amount}{feeLabel(app.fee_type)}
                  </span>
                  {app.retreat?.start_date && app.retreat?.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseDateOnly(app.retreat.start_date)!, 'MMM d')} - {format(parseDateOnly(app.retreat.end_date)!, 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
