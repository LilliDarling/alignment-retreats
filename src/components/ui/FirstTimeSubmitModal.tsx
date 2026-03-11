"use client";

import { X, Phone } from "lucide-react";

interface FirstTimeSubmitModalProps {
  open: boolean;
  onClose: () => void;
  type: "retreat" | "venue";
}

export default function FirstTimeSubmitModal({
  open,
  onClose,
  type,
}: FirstTimeSubmitModalProps) {
  if (!open) return null;

  const label = type === "retreat" ? "hosting a retreat" : "listing a venue";

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
              We&apos;ll be in touch shortly
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
            Since this is your first time {label} on Alignment Retreats, a
            member of our team will reach out to schedule a quick call with you.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;ll walk you through the process, make sure we have
            everything we need, and answer any questions you might have. We want
            to make sure your first experience with us is a great one.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
