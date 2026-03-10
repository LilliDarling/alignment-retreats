import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "muted" | "outline" | "warning";
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: "bg-primary/90 text-primary-foreground",
  muted: "bg-muted text-muted-foreground",
  outline: "bg-white/90 text-foreground border border-border",
  warning: "bg-amber-100 text-amber-800",
};

export default function Badge({ children, variant = "primary", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
