"use client";

import { X, Phone, Calendar } from "lucide-react";

const CALENDLY_COOP_ONBOARDING_URL =
  "https://calendly.com/mathew-vetten/co-op-onboarding";

interface FirstTimeSubmitModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FirstTimeSubmitModal({
  open,
  onClose,
}: FirstTimeSubmitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Submission received!
            </h2>
            <p className="text-xs text-muted-foreground">
              Book a call to get your retreat published
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Since this is your first time hosting a retreat on Alignment
            Retreats, please book a call with our team so we can go over your
            retreat and get it published.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;ll walk you through the process, make sure we have
            everything we need, and answer any questions you might have. We want
            to make sure your first experience with us is a great one.
          </p>
          <a
            href={CALENDLY_COOP_ONBOARDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book a Call
          </a>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-sm font-semibold transition-colors bg-muted text-foreground hover:bg-muted/80"
          >
            I&apos;ll do it later
          </button>
        </div>
      </div>
    </div>
  );
}
