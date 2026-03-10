"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "white";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  ghost:
    "text-primary hover:bg-primary/10",
  white:
    "bg-white text-primary hover:bg-background shadow-sm hover:shadow-md",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-6 py-2.5 text-[15px]",
  md: "px-8 py-3.5 text-[15px]",
  lg: "px-10 py-4 text-[15px]",
};

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[30px] transition-colors duration-300 cursor-pointer",
    variants[variant],
    sizes[size],
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  if (href) {
    const MotionLink = motion.create(Link);
    return (
      <MotionLink
        href={href}
        className={classes}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={springTransition}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={springTransition}
    >
      {children}
    </motion.button>
  );
}
