import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnderConstructionProps {
  title?: string;
}

export function UnderConstruction({ title = 'This Page' }: UnderConstructionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
            <Construction className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Under Alignment Construction
          </h1>
          <p className="text-muted-foreground mb-6">
            {title} is being built with care. Check back soon for updates!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link to="/retreats/browse">
              <Button>Browse Retreats</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
