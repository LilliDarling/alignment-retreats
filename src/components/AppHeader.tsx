import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Shield, Briefcase, LayoutDashboard, Calendar, MapPin, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  showSignOut?: boolean;
}

export function AppHeader({ showSignOut = true }: AppHeaderProps) {
  const { user, signOut, hasRole, hasAnyRole } = useAuth();
  const isAdmin = hasRole('admin');
  const showOpportunities = hasAnyRole(['host', 'cohost', 'staff', 'landowner']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        to="/retreats/browse"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        <Calendar className="w-4 h-4" />
        Retreats
      </Link>
      <Link
        to="/venues/browse"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        <MapPin className="w-4 h-4" />
        Venues
      </Link>
      {user && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/messages"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
          </Link>
        </>
      )}
      {showOpportunities && (
        <Link
          to="/opportunities"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(false)}
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
            onClick={() => setMobileOpen(false)}
          >
            <Shield className="w-4 h-4" />
            Admin
          </Link>
          <Link
            to="/directory"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <Users className="w-4 h-4" />
            Directory
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/2tb.svg" alt="Alignment Retreats" className="w-12 h-12" />
            <span className="text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {showSignOut && (
            <Button variant="outline" onClick={signOut} className="hidden sm:inline-flex">
              Sign Out
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks}
              </nav>
              {showSignOut && (
                <div className="mt-8 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => { setMobileOpen(false); signOut(); }} className="w-full">
                    Sign Out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
