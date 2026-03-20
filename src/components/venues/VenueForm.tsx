"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  X,
  MapPin,
  Users,
  AlertTriangle,
  ArrowLeft,
  Send,
  Save,
  Trash2,
  Loader2,
  Eye,
  Plus,
  ImageIcon,
  Video,
  Phone,
  Sparkles,
  Building2,
} from "lucide-react";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { Card, CardContent } from "@/components/ui/Card";
import {
  createProperty,
  updateProperty,
  submitPropertyForReview,
  deleteProperty,
} from "@/lib/actions/venue";
import {
  PROPERTY_TYPES,
  AMENITY_OPTIONS,
  FEATURE_OPTIONS,
  type VenueFormData,
} from "@/lib/constants/venue";
import { uploadVenueImage, uploadVenueVideo } from "@/lib/utils/upload";
import Link from "next/link";

import UnsavedChangesModal from "@/components/ui/UnsavedChangesModal";
import FirstTimeSubmitModal from "@/components/ui/FirstTimeSubmitModal";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface VenueFormProps {
  mode: "create" | "edit";
  propertyId?: string;
  initialData?: VenueFormData & { status?: string };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

export default function VenueForm({
  mode,
  propertyId,
  initialData,
}: VenueFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<VenueFormData>({
    name: initialData?.name || "",
    property_type: initialData?.property_type || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    capacity: initialData?.capacity ?? null,
    amenities: initialData?.amenities || [],
    property_features: initialData?.property_features || [],
    photos: initialData?.photos || [],
    videos: initialData?.videos || [],
    contact_name: initialData?.contact_name || "",
    contact_email: initialData?.contact_email || "",
    instagram_handle: initialData?.instagram_handle || "",
    tiktok_handle: initialData?.tiktok_handle || "",
  });

  const status = initialData?.status || "draft";
  const [saving, setSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { showModal: showUnsavedModal, guardedNavigate, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty);

  const validateFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (form.name.length > 150) errors.name = "Name must be 150 characters or fewer.";
    if (form.description.length > 5000) errors.description = "Description must be 5,000 characters or fewer.";
    if (form.location.length > 300) errors.location = "Location must be 300 characters or fewer.";
    if (form.capacity != null && form.capacity < 1) errors.capacity = "Capacity must be at least 1.";
    if (form.contact_name.length > 100) errors.contact_name = "Contact name must be 100 characters or fewer.";
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      errors.contact_email = "Please enter a valid email address.";
    }
    return errors;
  };

  const handleSaveAndLeave = async () => {
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    setError(null);
    if (mode === "create") {
      const result = await createProperty(form);
      setSaving(false);
      if ("error" in result) {
        setError(result.error);
        cancelLeave();
      } else {
        setIsDirty(false);
        router.push("/dashboard");
      }
    } else if (propertyId) {
      const result = await updateProperty(propertyId, form);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        cancelLeave();
      } else {
        setIsDirty(false);
        router.push("/dashboard");
      }
    }
  };

  const handlePreview = () => {
    if (!propertyId) return;
    sessionStorage.setItem(`venue_unsaved_${propertyId}`, JSON.stringify(form));
    window.open(`/venues/${propertyId}?unsaved=1`, "_blank");
    cancelLeave();
  };

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setSuccess(
        "Draft created! You can keep editing or submit for review when ready."
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  const isPublished = status === "published";

  const update = (field: keyof VenueFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setError(null);
    setSuccess(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const toggleAmenity = (id: string) => {
    setForm((prev) => {
      const has = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: has
          ? prev.amenities.filter((a) => a !== id)
          : [...prev.amenities, id],
      };
    });
    setIsDirty(true);
  };

  const toggleFeature = (id: string) => {
    setForm((prev) => {
      const has = prev.property_features.includes(id);
      return {
        ...prev,
        property_features: has
          ? prev.property_features.filter((f) => f !== id)
          : [...prev.property_features, id],
      };
    });
    setIsDirty(true);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const id = propertyId || `temp-${Date.now()}`;
    const result = await uploadVenueImage(id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, result.url],
      }));
      setIsDirty(true);
    }
    setUploading(false);
  };

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const id = propertyId || `temp-${Date.now()}`;
    const result = await uploadVenueVideo(id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setForm((prev) => ({
        ...prev,
        videos: [...prev.videos, result.url],
      }));
      setIsDirty(true);
    }
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const removeVideo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (isPublished && !showEditWarning) {
      setShowEditWarning(true);
      return;
    }

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (mode === "create") {
      const result = await createProperty(form);
      if ("error" in result) {
        setError(result.error);
        setSaving(false);
      } else {
        router.push(`/venues/${result.id}/edit?saved=1`);
      }
    } else if (propertyId) {
      const result = await updateProperty(propertyId, form);
      if (result.error) {
        setError(result.error);
      } else if (result.statusChanged) {
        setSuccess(
          "Property saved. Because it was previously published, it has been moved back to Pending Review and will need to be re-approved."
        );
        setShowEditWarning(false);
        setIsDirty(false);
      } else {
        setSuccess(
          status === "draft"
            ? "Draft saved. You can continue editing anytime — it won't be visible until you submit for review."
            : "Changes saved successfully."
        );
        setIsDirty(false);
      }
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleBookAndSubmit = async () => {
    if (!propertyId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitPropertyForReview(propertyId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Property submitted for review! You'll be notified once it's approved.");
        setShowSubmitModal(false);
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!propertyId) return;
    if (
      !confirm(
        "Are you sure you want to delete this property? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    const result = await deleteProperty(propertyId);
    if (result.error) {
      setError(result.error);
      setDeleting(false);
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 rounded-xl border bg-white text-foreground text-sm focus:outline-none focus:ring-2";
  const inputClass = (field?: string) =>
    `${inputBase} ${field && fieldErrors[field] ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-primary/20 focus:border-primary"}`;
  const labelClass = "text-sm font-medium text-foreground mb-1 block";
  const fieldError = (field: string) =>
    fieldErrors[field] ? <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p> : null;

  return (
    <>
    <FirstTimeSubmitModal
      open={showSubmitModal}
      onSaveAsDraft={() => {
        setShowSubmitModal(false);
        setSuccess("Draft saved. Book a call when you're ready to submit for review.");
      }}
      onBookAndSubmit={handleBookAndSubmit}
      submitting={submitting}
      saving={saving}
      type="venue"
    />
    <UnsavedChangesModal
      open={showUnsavedModal}
      onLeave={confirmLeave}
      onStay={cancelLeave}
      onSaveAndLeave={handleSaveAndLeave}
      onPreview={mode === "edit" && propertyId ? handlePreview : undefined}
      saving={saving}
    />
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => guardedNavigate(() => router.push("/dashboard"))}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-display text-foreground">
              {mode === "create" ? "List Your Property" : "Edit Property"}
            </h1>
            {mode === "edit" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Status:{" "}
                <span className="font-medium">
                  {STATUS_LABELS[status] || status}
                </span>
              </p>
            )}
          </div>
        </div>
        {mode === "edit" && propertyId && (
          <Link
            href={`/venues/${propertyId}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Link>
        )}
      </div>

      {/* Edit Warning for Published Properties */}
      {showEditWarning && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                This property is currently published
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Saving changes will move it back to{" "}
                <strong>Pending Review</strong>. It will be taken down until an
                admin re-approves it.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Anyway"}
                </button>
                <button
                  onClick={() => setShowEditWarning(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft info banner */}
      {mode === "edit" && status === "draft" && (
        <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700">
            This property is saved as a <strong>draft</strong> and is only
            visible to you. When you&apos;re ready, click{" "}
            <strong>Submit for Review</strong> to have it reviewed and listed
            publicly.
          </p>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Photos */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Photos
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add high-quality photos of your space. The first photo will be
                your cover image.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.photos.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden group"
                >
                  <Image
                    src={url}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 250px"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                      Cover
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Videos
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Showcase your venue with a walkthrough or highlight reel.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {form.videos.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-black group"
                >
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-xs">Add Video</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Basic Information
            </h2>

            <div>
              <label htmlFor="name" className={labelClass}>
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass("name")}
                placeholder="e.g. Blue Ridge Retreat Center"
              />
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor="property_type" className={labelClass}>
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                id="property_type"
                value={form.property_type}
                onChange={(e) => update("property_type", e.target.value)}
                className={inputClass("property_type")}
              >
                <option value="">Select a type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                className={`${inputClass("description")} resize-none`}
                placeholder="Describe your property — the setting, vibe, what makes it unique, and what kinds of retreats it's suited for..."
              />
              {fieldError("description")}
            </div>
          </CardContent>
        </Card>

        {/* Location & Capacity */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Location & Capacity
            </h2>

            <div>
              <label htmlFor="location" className={labelClass}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className={inputClass("location")}
                placeholder="e.g. Asheville, North Carolina, USA"
              />
              {fieldError("location") || (
                <p className="text-xs text-muted-foreground mt-1">
                  City, State / Region, Country
                </p>
              )}
            </div>

            <div>
              <label htmlFor="capacity" className={labelClass}>
                <Users className="w-4 h-4 inline mr-1" />
                Maximum Capacity
              </label>
              <input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity ?? ""}
                onChange={(e) =>
                  update(
                    "capacity",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className={inputClass("capacity")}
                placeholder="How many guests can your property host?"
              />
              {fieldError("capacity") || (
                <p className="text-xs text-muted-foreground mt-1">
                  Total number of people that can be accommodated (sleeping +
                  day-use).
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold">Amenities</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select everything available at your property.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITY_OPTIONS.map((option) => {
                const isSelected = form.amenities.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleAmenity(option.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Special Features */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> What Makes It
                Special
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Highlight the unique qualities of your property that make it
                ideal for retreats.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEATURE_OPTIONS.map((option) => {
                const isSelected = form.property_features.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleFeature(option.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Contact Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                How should hosts reach you about bookings? This will be shown to
                interested hosts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact_name" className={labelClass}>
                  Contact Name
                </label>
                <input
                  id="contact_name"
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => update("contact_name", e.target.value)}
                  className={inputClass("contact_name")}
                  placeholder="Your name or booking contact"
                />
                {fieldError("contact_name")}
              </div>
              <div>
                <label htmlFor="contact_email" className={labelClass}>
                  Contact Email
                </label>
                <input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => update("contact_email", e.target.value)}
                  className={inputClass("contact_email")}
                  placeholder="bookings@yourproperty.com"
                />
                {fieldError("contact_email")}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagram_handle" className={labelClass}>
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    @
                  </span>
                  <input
                    id="instagram_handle"
                    type="text"
                    value={form.instagram_handle}
                    onChange={(e) =>
                      update(
                        "instagram_handle",
                        e.target.value.replace(/^@/, "")
                      )
                    }
                    className={`${inputClass("instagram_handle")} pl-8`}
                    placeholder="yourproperty"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="tiktok_handle" className={labelClass}>
                  TikTok Handle
                </label>
                <div className="relative">
                  <TikTokIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="tiktok_handle"
                    type="text"
                    value={form.tiktok_handle}
                    onChange={(e) =>
                      update(
                        "tiktok_handle",
                        e.target.value.replace(/^@/, "")
                      )
                    }
                    className={`${inputClass("tiktok_handle")} pl-8`}
                    placeholder="yourproperty"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === "create"
              ? "Create Draft"
              : saving
                ? "Saving..."
                : "Save Changes"}
          </button>

          {mode === "edit" &&
            (status === "draft" || status === "pending_review") && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isDirty}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {status === "pending_review"
                    ? "Resubmit for Review"
                    : "Submit for Review"}
                </button>
                {isDirty && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Save your changes first
                  </span>
                )}
              </div>
            )}

          {mode === "edit" &&
            (status === "draft" || status === "pending_review") && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer ml-auto"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Property
              </button>
            )}
        </div>
      </div>
    </main>
    </>
  );
}
