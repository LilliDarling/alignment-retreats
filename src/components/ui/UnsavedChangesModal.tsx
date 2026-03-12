"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface UnsavedChangesModalProps {
  open: boolean;
  onLeave: () => void;
  onStay: () => void;
  onSaveAndLeave: () => void | Promise<void>;
  onPreview?: () => void;
  saving?: boolean;
}

export default function UnsavedChangesModal({
  open,
  onLeave,
  onStay,
  onSaveAndLeave,
  onPreview,
  saving = false,
}: UnsavedChangesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onStay}
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Unsaved changes
            </h2>
            <p className="text-xs text-muted-foreground">
              You have changes that haven&apos;t been saved
            </p>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <button
            type="button"
            onClick={onSaveAndLeave}
            disabled={saving}
            className="w-full py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Leave and save"}
          </button>
          <button
            type="button"
            onClick={onStay}
            disabled={saving}
            className="w-full py-2.5 rounded-full text-sm font-medium border border-border text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            Stay and keep editing
          </button>
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              disabled={saving}
              className="w-full py-2.5 rounded-full text-sm font-medium border border-border text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              Preview changes
            </button>
          )}
          <button
            type="button"
            onClick={onLeave}
            disabled={saving}
            className="w-full py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Leave and don&apos;t save
          </button>
        </div>
      </div>
    </div>
  );
}
