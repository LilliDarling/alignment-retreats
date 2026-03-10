"use client";

import { useState } from "react";
import { updateAbout } from "@/lib/actions/profile";
import type { EditableProfile, AboutUpdate } from "@/types/profile";

interface AboutFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function AboutForm({ profile, onSaved, onCancel }: AboutFormProps) {
  const [whatIOffer, setWhatIOffer] = useState(profile.what_i_offer || "");
  const [whatImLookingFor, setWhatImLookingFor] = useState(profile.what_im_looking_for || "");
  const [availability, setAvailability] = useState(profile.availability_status || "");
  const [travelWilling, setTravelWilling] = useState(profile.travel_willing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: AboutUpdate = {
      what_i_offer: whatIOffer.trim() || null,
      what_im_looking_for: whatImLookingFor.trim() || null,
      availability_status: availability || null,
      travel_willing: travelWilling,
    };
    const result = await updateAbout(data);
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
        <label htmlFor="offer" className="text-sm font-medium text-foreground mb-1 block">
          What I Offer
        </label>
        <textarea
          id="offer"
          value={whatIOffer}
          onChange={(e) => setWhatIOffer(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="Describe your services, specialties, or what you bring to retreats..."
        />
      </div>

      <div>
        <label htmlFor="looking" className="text-sm font-medium text-foreground mb-1 block">
          What I&apos;m Looking For
        </label>
        <textarea
          id="looking"
          value={whatImLookingFor}
          onChange={(e) => setWhatImLookingFor(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="What kind of opportunities or collaborations interest you..."
        />
      </div>

      <div>
        <label htmlFor="availability" className="text-sm font-medium text-foreground mb-1 block">
          Availability
        </label>
        <select
          id="availability"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Select availability</option>
          <option value="available">Available</option>
          <option value="limited">Limited Availability</option>
          <option value="booked">Fully Booked</option>
          <option value="not_available">Not Available</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={travelWilling}
          onClick={() => setTravelWilling(!travelWilling)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            travelWilling ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              travelWilling ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-foreground">Willing to travel</span>
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
