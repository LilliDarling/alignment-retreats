import { Card, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

export default function StaffTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">Staff Dashboard</h3>
        <p className="text-muted-foreground">Coming soon — manage your services, availability, and gig requests.</p>
      </CardContent>
    </Card>
  );
}
