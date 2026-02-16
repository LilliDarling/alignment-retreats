import { Link } from "react-router-dom";
import { Users, Shield, Briefcase, LayoutDashboard, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  showSignOut?: boolean;
}

export function AppHeader({ showSignOut = true }: AppHeaderProps) {
  const { user, signOut, hasRole, hasAnyRole } = useAuth();
  const isAdmin = hasRole('admin');
  const showOpportunities = hasAnyRole(['host', 'cohost', 'staff', 'landowner']);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/2tb.svg" alt="Alignment Retreats" className="w-12 h-12" />
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              to="/retreats/browse"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Retreats
            </Link>
            <Link
              to="/venues/browse"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Venues
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            {showOpportunities && (
              <Link
                to="/opportunities"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Opportunities
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
                <Link
                  to="/directory"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Directory
                </Link>
              </>
            )}
          </nav>
        </div>
        {showSignOut && (
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}
