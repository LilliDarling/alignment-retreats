"use client";

import { ClipboardCheck, Save, Loader2, Send } from "lucide-react";

interface FirstTimeSubmitModalProps {
  open: boolean;
  onSaveAsDraft: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  saving?: boolean;
  type?: "retreat" | "venue";
}

export default function FirstTimeSubmitModal({
  open,
  onSaveAsDraft,
  onSubmit,
  submitting,
  saving,
  type = "retreat",
}: FirstTimeSubmitModalProps) {
  if (!open) return null;

  const label = type === "retreat" ? "retreat" : "property";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Ready to submit?
            </h2>
            <p className="text-xs text-muted-foreground">
              Send your {label} for review
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Our team will review your {label} and reach out if we need any
            additional information.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please allow up to <span className="font-medium text-foreground">10 business days</span> for review.
            You can keep editing your draft anytime before submitting.
          </p>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "Submitting..." : "Submit for Review"}
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
