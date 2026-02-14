import { Card, CardContent } from '@/components/ui/card';
import { Handshake } from 'lucide-react';

export default function CohostTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">Co-Host Dashboard</h3>
        <p className="text-muted-foreground">Coming soon — manage your co-hosting partnerships and availability.</p>
      </CardContent>
    </Card>
  );
}
