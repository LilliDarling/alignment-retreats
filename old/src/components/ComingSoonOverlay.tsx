import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ComingSoonOverlayProps {
  children: React.ReactNode;
}

export function ComingSoonOverlay({ children }: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl px-8 py-6 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-semibold text-foreground">Dashboard Coming Soon</span>
          <span className="text-sm text-muted-foreground text-center max-w-[250px]">
            We're building something great! In the meantime, start planning your retreat.
          </span>
          <Button asChild className="mt-2">
            <Link to="/retreats/submit">Submit a Retreat</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
