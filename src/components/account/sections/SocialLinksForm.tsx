"use client";

import { useState } from "react";
import { Instagram, Globe } from "lucide-react";
import { updateSocialLinks } from "@/lib/actions/profile";
import type { EditableProfile, SocialLinksUpdate } from "@/types/profile";

interface SocialLinksFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function SocialLinksForm({ profile, onSaved, onCancel }: SocialLinksFormProps) {
  const [instagram, setInstagram] = useState(profile.instagram_handle || "");
  const [tiktok, setTiktok] = useState(profile.tiktok_handle || "");
  const [website, setWebsite] = useState(profile.website_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: SocialLinksUpdate = {
      instagram_handle: instagram.trim().replace(/^@/, "") || null,
      tiktok_handle: tiktok.trim().replace(/^@/, "") || null,
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
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="yourusername"
          />
        </div>
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
            onChange={(e) => setTiktok(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="yourusername"
          />
        </div>
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
