"use client";

import { useState } from "react";
import { Instagram, Globe } from "lucide-react";
import { updateSocialLinks } from "@/lib/actions/profile";
import type { EditableProfile, SocialLinksUpdate } from "@/types/profile";
import UnsavedChangesModal from "@/components/ui/UnsavedChangesModal";

interface SocialLinksFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

// Extract handle from a value that might be a full URL or @handle
function extractHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    // Pull the last non-empty path segment as the handle
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : "";
  } catch {
    // Not a URL — strip @ and any leading/trailing slashes
    return trimmed.replace(/^@/, "").replace(/\//g, "");
  }
}

// Only allows alphanumeric, underscores, and dots (standard social handle chars)
const HANDLE_REGEX = /^[a-zA-Z0-9._]*$/;

function validateHandle(value: string, platform: string): string | null {
  if (!value) return null;
  if (!HANDLE_REGEX.test(value)) {
    return `Enter your ${platform} username only (e.g. yourname), not a URL`;
  }
  if (value.length > 30) {
    return "Handle must be 30 characters or fewer";
  }
  return null;
}

export default function SocialLinksForm({ profile, onSaved, onCancel }: SocialLinksFormProps) {
  const [instagram, setInstagram] = useState(profile.instagram_handle || "");
  const [tiktok, setTiktok] = useState(profile.tiktok_handle || "");
  const [website, setWebsite] = useState(profile.website_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const igError = validateHandle(instagram, "Instagram");
  const ttError = validateHandle(tiktok, "TikTok");
  const hasValidationErrors = !!igError || !!ttError;

  const isDirty =
    instagram !== (profile.instagram_handle || "") ||
    tiktok !== (profile.tiktok_handle || "") ||
    website !== (profile.website_url || "");

  const handleInstagramChange = (value: string) => {
    // Auto-extract handle if user pastes a URL
    if (value.includes("/") || value.includes("instagram.com")) {
      setInstagram(extractHandle(value));
    } else {
      setInstagram(value.replace(/^@/, ""));
    }
  };

  const handleTiktokChange = (value: string) => {
    if (value.includes("/") || value.includes("tiktok.com")) {
      setTiktok(extractHandle(value));
    } else {
      setTiktok(value.replace(/^@/, ""));
    }
  };

  const handleCancel = () => {
    if (isDirty) { setShowCancelModal(true); } else { onCancel?.(); }
  };

  const handleSave = async () => {
    if (hasValidationErrors) return;
    setSaving(true);
    setError(null);
    const data: SocialLinksUpdate = {
      instagram_handle: instagram.trim() || null,
      tiktok_handle: tiktok.trim() || null,
      website_url: website.trim() || null,
    };
    const result = await updateSocialLinks(data);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved?.();
    }
    setSaving(false);
  };

  const inputBase =
    "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const inputError = "border-red-300 focus:ring-red-200 focus:border-red-400";
  const inputNormal = "border-border";

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="instagram" className="text-sm font-medium text-foreground mb-1 block">
          Instagram
        </label>
        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="instagram"
            type="text"
            value={instagram}
            onChange={(e) => handleInstagramChange(e.target.value)}
            className={`${inputBase} ${igError ? inputError : inputNormal}`}
            placeholder="yourusername"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Handle only — no @ or full URL
        </p>
        {igError && (
          <p className="text-xs text-red-600 mt-1">{igError}</p>
        )}
      </div>

      <div>
        <label htmlFor="tiktok" className="text-sm font-medium text-foreground mb-1 block">
          TikTok
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
          <input
            id="tiktok"
            type="text"
            value={tiktok}
            onChange={(e) => handleTiktokChange(e.target.value)}
            className={`w-full pl-8 pr-4 py-2.5 rounded-xl border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${ttError ? inputError : inputNormal}`}
            placeholder="yourusername"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Handle only — no @ or full URL
        </p>
        {ttError && (
          <p className="text-xs text-red-600 mt-1">{ttError}</p>
        )}
      </div>

      <div>
        <label htmlFor="website" className="text-sm font-medium text-foreground mb-1 block">
          Website
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={`${inputBase} ${inputNormal}`}
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <UnsavedChangesModal
        open={showCancelModal}
        onLeave={() => { setShowCancelModal(false); onCancel?.(); }}
        onStay={() => setShowCancelModal(false)}
        onSaveAndLeave={async () => { await handleSave(); setShowCancelModal(false); }}
        saving={saving}
      />

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || hasValidationErrors}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
