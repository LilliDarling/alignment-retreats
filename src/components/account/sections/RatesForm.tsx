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

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "MXN"];

export default function RatesForm({ profile, onSaved, onCancel }: RatesFormProps) {
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate != null ? String(profile.hourly_rate) : "");
  const [dailyRate, setDailyRate] = useState(profile.daily_rate != null ? String(profile.daily_rate) : "");
  const [currency, setCurrency] = useState(profile.rate_currency || "USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: RatesUpdate = {
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      daily_rate: dailyRate ? parseFloat(dailyRate) : null,
      rate_currency: currency,
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
      <div>
        <label htmlFor="currency" className="text-sm font-medium text-foreground mb-1 block">
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-40 px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hourly" className="text-sm font-medium text-foreground mb-1 block">
            Hourly Rate
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="hourly"
              type="number"
              min={0}
              step={0.01}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="daily" className="text-sm font-medium text-foreground mb-1 block">
            Daily Rate
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="daily"
              type="number"
              min={0}
              step={0.01}
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="0.00"
            />
          </div>
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
