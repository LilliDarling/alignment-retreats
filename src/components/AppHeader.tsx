import { Link } from "react-router-dom";
import { Leaf, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  showSignOut?: boolean;
}

export function AppHeader({ showSignOut = true }: AppHeaderProps) {
  const { signOut, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>
          {isAdmin && (
            <nav className="hidden md:flex items-center gap-4">
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
            </nav>
          )}
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
