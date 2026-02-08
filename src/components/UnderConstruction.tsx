import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CALENDLY_COOP_ONBOARDING_URL } from '@/config/constants';

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
        <div className="text-center max-w-lg">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-6">
            <Construction className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Under Alignment Construction
          </h1>
          <p className="text-muted-foreground mb-6">
            {title} is being built with care. Check back soon for updates!
          </p>

          {/* Co-Op CTA */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-left mb-6">
            <div className="flex items-start gap-3">
              <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Want to join the Co-Op?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Become a founding member of Alignment Retreats. Schedule a call to learn about
                  membership tiers and start your journey as a co-owner.
                </p>
                <a
                  href={CALENDLY_COOP_ONBOARDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    <Crown className="mr-2 h-4 w-4" />
                    Schedule Co-Op Onboarding Call
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

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
