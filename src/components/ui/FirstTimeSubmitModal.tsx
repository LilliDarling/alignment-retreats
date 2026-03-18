"use client";

import { Phone, Calendar, Save, Loader2 } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/mathew-vetten/co-op-onboarding";

interface FirstTimeSubmitModalProps {
  open: boolean;
  onSaveAsDraft: () => void;
  onBookAndSubmit: () => void;
  submitting?: boolean;
  saving?: boolean;
  type?: "retreat" | "venue";
}

export default function FirstTimeSubmitModal({
  open,
  onSaveAsDraft,
  onBookAndSubmit,
  submitting,
  saving,
  type = "retreat",
}: FirstTimeSubmitModalProps) {
  if (!open) return null;

  const label = type === "retreat" ? "retreat" : "property";

  const handleBookCall = () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    onBookAndSubmit();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Ready to submit?
            </h2>
            <p className="text-xs text-muted-foreground">
              Book a call to get your {label} reviewed
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Before we can review your {label}, we need to hop on a quick call
            to make sure everything is set up for success.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;ll go over the details together, answer any questions, and
            get your {label} on the path to being published. If you&apos;re not
            ready to book a call yet, you can save your progress as a draft and
            come back anytime.
          </p>

          <button
            onClick={handleBookCall}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {submitting ? "Submitting..." : "Book a Call & Submit"}
          </button>

          <button
            onClick={onSaveAsDraft}
            disabled={saving || submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-semibold transition-colors border-2 border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save as Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
