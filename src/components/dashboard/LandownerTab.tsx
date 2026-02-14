import { Card, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function LandownerTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">Venue Dashboard</h3>
        <p className="text-muted-foreground">Coming soon — manage your properties and booking requests.</p>
      </CardContent>
    </Card>
  );
}
