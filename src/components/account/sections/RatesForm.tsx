"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { updateRates } from "@/lib/actions/profile";
import type { EditableProfile, RatesUpdate } from "@/types/profile";

interface RatesFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function RatesForm({ profile, onSaved, onCancel }: RatesFormProps) {
  const [rate, setRate] = useState(profile.rate != null ? String(profile.rate) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: RatesUpdate = {
      rate: rate ? parseFloat(rate) : null,
      rate_currency: "CAD",
    };
    const result = await updateRates(data);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rate" className="text-sm font-medium text-foreground mb-1 block">
            Rate (per person)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="rate"
              type="number"
              min={0}
              step={0.01}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex items-end pb-1">
          <span className="text-sm text-muted-foreground">CAD</span>
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
