"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, MapPin, X } from "lucide-react";
import { uploadProfilePhoto } from "@/lib/utils/upload";
import { updateBasicInfo } from "@/lib/actions/profile";
import type { EditableProfile, BasicInfoUpdate } from "@/types/profile";
import UnsavedChangesModal from "@/components/ui/UnsavedChangesModal";

interface BasicInfoFormProps {
  profile: EditableProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function BasicInfoForm({ profile, onSaved, onCancel }: BasicInfoFormProps) {
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [photoUrl, setPhotoUrl] = useState(profile.profile_photo || "");
  const [coverUrl, setCoverUrl] = useState(profile.cover_photo || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isDirty =
    name !== (profile.name || "") ||
    bio !== (profile.bio || "") ||
    location !== (profile.location || "") ||
    photoUrl !== (profile.profile_photo || "") ||
    coverUrl !== (profile.cover_photo || "");

  const handleCancel = () => {
    if (isDirty) { setShowCancelModal(true); } else { onCancel?.(); }
  };
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const result = await uploadProfilePhoto(profile.id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setPhotoUrl(result.url);
    }
    setUploading(false);
  };

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const result = await uploadProfilePhoto(profile.id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setCoverUrl(result.url);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const data: BasicInfoUpdate = {
      name: name.trim(),
      bio: bio.trim() || null,
      location: location.trim() || null,
      profile_photo: photoUrl || null,
      cover_photo: coverUrl || null,
    };
    const result = await updateBasicInfo(data);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Cover Photo */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Cover Photo</label>
        <div
          className="relative h-40 rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverUrl ? (
            <>
              <Image src={coverUrl} alt="Cover" fill className="object-cover" sizes="100vw" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCoverUrl(""); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
              <Camera className="w-6 h-6 mr-2" />
              <span className="text-sm">Add cover photo</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
        />
      </div>

      {/* Profile Photo */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Profile Photo</label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden bg-muted cursor-pointer group shrink-0"
            onClick={() => photoInputRef.current?.click()}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="Profile" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                <Camera className="w-6 h-6" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Click to upload. JPEG, PNG, or WebP. Max 50MB.
          </div>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground mb-1 block">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Your full name"
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="text-sm font-medium text-foreground mb-1 block">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="Tell people about yourself..."
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="text-sm font-medium text-foreground mb-1 block">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="City, Country"
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

      {/* Actions */}
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
          disabled={saving || uploading}
          className="px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
