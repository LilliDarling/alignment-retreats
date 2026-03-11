"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import SupportModal from "@/components/ui/SupportModal";

interface SupportButtonProps {
  variant?: "pill" | "link" | "ghost";
  className?: string;
  label?: string;
}

export default function SupportButton({
  variant = "pill",
  className = "",
  label = "Get Support",
}: SupportButtonProps) {
  const [open, setOpen] = useState(false);

  let buttonClass = "";
  let iconClass = "w-4 h-4";

  if (variant === "link") {
    buttonClass = `inline-flex items-center gap-1.5 text-sm hover:underline ${className}`;
    iconClass = "w-3.5 h-3.5";
  } else if (variant === "ghost") {
    buttonClass = `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors ${className}`;
  } else {
    buttonClass = `inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors ${className}`;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClass}>
        <HelpCircle className={iconClass} />
        {label}
      </button>
      <SupportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
