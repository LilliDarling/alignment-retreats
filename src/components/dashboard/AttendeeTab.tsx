import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function AttendeeTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">My Retreats</h3>
        <p className="text-muted-foreground">Coming soon — view your bookings, saved retreats, and recommendations.</p>
      </CardContent>
    </Card>
  );
}
