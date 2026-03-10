"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { updateProfessional } from "@/lib/actions/profile";
import type { EditableProfile, ProfessionalUpdate } from "@/types/profile";

interface ProfessionalFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTags = (value: string) => {
    const newTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t));
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setInput("");
  };

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTags(input); }
          }}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => addTags(input)}
          className="px-3 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProfessionalForm({ profile, onSaved, onCancel }: ProfessionalFormProps) {
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(profile.expertise_areas || []);
  const [certifications, setCertifications] = useState<string[]>(profile.certifications || []);
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);
  const [yearsExperience, setYearsExperience] = useState<string>(
    profile.years_experience != null ? String(profile.years_experience) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data: ProfessionalUpdate = {
      expertise_areas: expertiseAreas,
      certifications,
      languages,
      years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
    };
    const result = await updateProfessional(data);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <TagInput
        label="Expertise Areas"
        placeholder="e.g. Yoga, Meditation, Breathwork"
        tags={expertiseAreas}
        onChange={setExpertiseAreas}
      />

      <TagInput
        label="Certifications"
        placeholder="e.g. RYT-200, Reiki Master"
        tags={certifications}
        onChange={setCertifications}
      />

      <TagInput
        label="Languages"
        placeholder="e.g. English, Spanish"
        tags={languages}
        onChange={setLanguages}
      />

      <div>
        <label htmlFor="years" className="text-sm font-medium text-foreground mb-1 block">
          Years of Experience
        </label>
        <input
          id="years"
          type="number"
          min={0}
          max={99}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className="w-32 px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="0"
        />
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
