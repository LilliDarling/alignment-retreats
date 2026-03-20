"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
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
  Handshake,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  createRetreat,
  updateRetreat,
  submitRetreatForReview,
  deleteRetreat,
  getPublishedVenues,
} from "@/lib/actions/retreat";
import { RETREAT_TYPES, TEAM_NEEDS_OPTIONS, createEmptyDay, parseItinerary, serializeItinerary } from "@/lib/constants/retreat";
import type { RetreatFormData, VenueOption, ScheduleDay, LookingFor } from "@/lib/constants/retreat";
import ItineraryBuilder from "@/components/retreats/ItineraryBuilder";
import { uploadRetreatImage, uploadRetreatVideo } from "@/lib/utils/upload";
import Link from "next/link";
import FirstTimeSubmitModal from "@/components/ui/FirstTimeSubmitModal";
import UnsavedChangesModal from "@/components/ui/UnsavedChangesModal";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface RetreatFormProps {
  mode: "create" | "edit";
  retreatId?: string;
  retreatSlug?: string;
  initialData?: RetreatFormData & { status?: string };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  full: "Full",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function RetreatForm({
  mode,
  retreatId,
  retreatSlug,
  initialData,
}: RetreatFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<RetreatFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    retreat_type: initialData?.retreat_type || "",
    start_date: initialData?.start_date || "",
    end_date: initialData?.end_date || "",
    property_id: initialData?.property_id ?? null,
    custom_venue_name: initialData?.custom_venue_name || "",
    location_details: initialData?.location_details || "",
    max_attendees: initialData?.max_attendees ?? null,
    price_per_person: initialData?.price_per_person ?? null,
    what_you_offer: initialData?.what_you_offer || "",
    what_to_bring: initialData?.what_to_bring || "",
    sample_itinerary: initialData?.sample_itinerary || "",
    main_image: initialData?.main_image || null,
    gallery_images: initialData?.gallery_images || [],
    gallery_videos: initialData?.gallery_videos || [],
    allow_donations: false,
    looking_for: initialData?.looking_for || { needs: [], notes: {} },
  });

  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    const parsed = parseItinerary(initialData?.sample_itinerary || "");
    return parsed || [createEmptyDay(1)];
  });

  const status = initialData?.status || "draft";
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [venuesLoaded, setVenuesLoaded] = useState(false);
  const [venueMode, setVenueMode] = useState<"platform" | "custom">(
    initialData?.property_id ? "platform" : "custom"
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const { showModal: showUnsavedModal, guardedNavigate, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty);

  const validateFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (form.title.length > 150) errors.title = "Title must be 150 characters or fewer.";
    if (form.description.length > 5000) errors.description = "Description must be 5,000 characters or fewer.";
    if (form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)) {
      errors.end_date = "End date must be after start date.";
    }
    if (form.custom_venue_name.length > 200) errors.custom_venue_name = "Venue name must be 200 characters or fewer.";
    if ((form.location_details?.length ?? 0) > 300) errors.location_details = "Location details must be 300 characters or fewer.";
    if ((form.what_you_offer?.length ?? 0) > 3000) errors.what_you_offer = "What you offer must be 3,000 characters or fewer.";
    if ((form.what_to_bring?.length ?? 0) > 2000) errors.what_to_bring = "What to bring must be 2,000 characters or fewer.";
    if (form.price_per_person != null && form.price_per_person < 0) errors.price_per_person = "Price cannot be negative.";
    if (form.max_attendees != null && form.max_attendees < 1) errors.max_attendees = "Max attendees must be at least 1.";
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
    const formWithSchedule = { ...form, sample_itinerary: serializeItinerary(schedule) };
    try {
      if (mode === "create") {
        const result = await createRetreat(formWithSchedule);
        if ("error" in result) {
          setError(result.error);
          cancelLeave();
        } else {
          setIsDirty(false);
          router.push("/dashboard");
        }
      } else if (retreatId) {
        const result = await updateRetreat(retreatId, formWithSchedule);
        if (result.error) {
          setError(result.error);
          cancelLeave();
        } else {
          setIsDirty(false);
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      cancelLeave();
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!retreatId) return;
    const formWithSchedule = { ...form, sample_itinerary: serializeItinerary(schedule) };
    sessionStorage.setItem(`retreat_unsaved_${retreatId}`, JSON.stringify(formWithSchedule));
    window.open(`/retreats/${retreatSlug || retreatId}?unsaved=1`, "_blank");
    cancelLeave();
  };

  // Load published venues for the dropdown + auto-select from ?venue= param
  useEffect(() => {
    getPublishedVenues().then((v) => {
      setVenues(v);
      setVenuesLoaded(true);

      const preselectedVenue = searchParams.get("venue");
      if (preselectedVenue && mode === "create" && !initialData?.property_id) {
        const match = v.find((venue) => venue.id === preselectedVenue);
        if (match) {
          setForm((prev) => ({ ...prev, property_id: match.id }));
          setVenueMode("platform");
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show success message when redirected after creating a draft
  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setSuccess("Draft created! You can keep editing or submit for review when ready.");
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  const isPublished = status === "published" || status === "full";

  const update = (field: keyof RetreatFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setError(null);
    setSuccess(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    // Use a temp ID for new retreats
    const id = retreatId || `temp-${Date.now()}`;
    const result = await uploadRetreatImage(id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      update("main_image", result.url);
    }
    setUploading(false);
  };

  const handleGalleryImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const id = retreatId || `temp-${Date.now()}`;
    const result = await uploadRetreatImage(id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setForm((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, result.url],
      }));
      setError(null);
      setSuccess(null);
    }
    setUploading(false);
  };

  const handleGalleryVideoUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const id = retreatId || `temp-${Date.now()}`;
    const result = await uploadRetreatVideo(id, file);
    if ("error" in result) {
      setError(result.error);
    } else {
      setForm((prev) => ({
        ...prev,
        gallery_videos: [...prev.gallery_videos, result.url],
      }));
      setError(null);
      setSuccess(null);
    }
    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const removeGalleryVideo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery_videos: prev.gallery_videos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    // If published, show warning first
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

    // Serialize the structured schedule into sample_itinerary
    const formWithSchedule = {
      ...form,
      sample_itinerary: serializeItinerary(schedule),
    };

    try {
      if (mode === "create") {
        const result = await createRetreat(formWithSchedule);
        if ("error" in result) {
          setError(result.error);
        } else {
          setIsDirty(false);
          router.push(`/host/retreats/${result.id}/edit?saved=1`);
        }
      } else if (retreatId) {
        const result = await updateRetreat(retreatId, formWithSchedule);
        if (result.error) {
          setError(result.error);
        } else if (result.statusChanged) {
          setSuccess(
            "Retreat saved. Because it was previously published, it has been moved back to Pending Review and will need to be re-approved."
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
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    setShowFirstTimeModal(true);
  };

  const handleBookAndSubmit = async () => {
    if (!retreatId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitRetreatForReview(retreatId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Retreat submitted for review! You'll be notified once it's approved.");
        setShowFirstTimeModal(false);
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!retreatId) return;
    if (!confirm("Are you sure you want to delete this retreat? This cannot be undone.")) return;
    setDeleting(true);
    const result = await deleteRetreat(retreatId);
    if (result.error) {
      setError(result.error);
      setDeleting(false);
    }
    // redirect happens in the action
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
      open={showFirstTimeModal}
      onSaveAsDraft={() => {
        setShowFirstTimeModal(false);
        setSuccess("Draft saved. Book a call when you're ready to submit for review.");
      }}
      onBookAndSubmit={handleBookAndSubmit}
      submitting={submitting}
      saving={saving}
      type="retreat"
    />
    <UnsavedChangesModal
      open={showUnsavedModal}
      onLeave={confirmLeave}
      onStay={cancelLeave}
      onSaveAndLeave={handleSaveAndLeave}
      onPreview={mode === "edit" && retreatId ? handlePreview : undefined}
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
              {mode === "create" ? "Create New Retreat" : "Edit Retreat"}
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
        {mode === "edit" && retreatSlug && (
          <Link
            href={`/retreats/${retreatSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Link>
        )}
      </div>

      {/* Edit Warning for Published Retreats */}
      {showEditWarning && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                This retreat is currently published
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Saving changes will move it back to <strong>Pending Review</strong>.
                It will be taken down until an admin re-approves it.
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
            This retreat is saved as a <strong>draft</strong> and is only visible to you.
            When you&apos;re ready, click <strong>Submit for Review</strong> to have it reviewed and published.
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
        {/* Cover Image */}
        <Card>
          <CardContent>
            <label className={labelClass}>Cover Image</label>
            <div
              className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-muted cursor-pointer group mt-2"
              onClick={() => imageInputRef.current?.click()}
            >
              {form.main_image ? (
                <>
                  <Image
                    src={form.main_image}
                    alt="Retreat cover"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      update("main_image", null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Change image
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">Add a cover image</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleImageUpload(e.target.files[0])
              }
            />
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold">Gallery</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add photos and videos to showcase your retreat experience.
              </p>
            </div>

            {/* Gallery Images */}
            <div>
              <label className={labelClass}>
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Photos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {form.gallery_images.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                    <Image
                      src={url}
                      alt={`Gallery photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 250px"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryImageInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-xs">Add Photo</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={galleryImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleGalleryImageUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Gallery Videos */}
            <div>
              <label className={labelClass}>
                <Video className="w-4 h-4 inline mr-1" />
                Videos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {form.gallery_videos.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-black group">
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      playsInline
                      preload="auto"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryVideo(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => galleryVideoInputRef.current?.click()}
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
                ref={galleryVideoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleGalleryVideoUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold">
              Basic Information
            </h2>

            <div>
              <label htmlFor="title" className={labelClass}>
                Retreat Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className={inputClass("title")}
                placeholder="e.g. 7-Day Yoga & Meditation Retreat"
              />
              {fieldError("title")}
            </div>

            <div>
              <label htmlFor="retreat_type" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="retreat_type"
                value={form.retreat_type}
                onChange={(e) => update("retreat_type", e.target.value)}
                className={inputClass("retreat_type")}
              >
                <option value="">Select a category</option>
                {RETREAT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
                placeholder="Describe your retreat experience..."
              />
              {fieldError("description")}
            </div>
          </CardContent>
        </Card>

        {/* Dates & Location */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Dates & Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className={labelClass}>
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update("start_date", e.target.value)}
                  className={inputClass("start_date")}
                />
                {fieldError("start_date")}
              </div>
              <div>
                <label htmlFor="end_date" className={labelClass}>
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => update("end_date", e.target.value)}
                  className={inputClass("end_date")}
                />
                {fieldError("end_date")}
              </div>
            </div>

            {/* Venue Selection */}
            <div>
              <label className={labelClass}>
                <MapPin className="w-4 h-4 inline mr-1" />
                Venue <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 mt-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setVenueMode("platform");
                    if (!form.property_id) {
                      update("custom_venue_name", "");
                      update("location_details", "");
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    venueMode === "platform"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Select a Venue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVenueMode("custom");
                    update("property_id", null);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    venueMode === "custom"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Enter Custom Location
                </button>
              </div>

              {venueMode === "platform" ? (
                <div className="space-y-3">
                  <select
                    id="property_id"
                    value={form.property_id || ""}
                    onChange={(e) => {
                      const venueId = e.target.value || null;
                      update("property_id", venueId);
                      if (venueId) {
                        const venue = venues.find((v) => v.id === venueId);
                        if (venue) {
                          update("custom_venue_name", venue.name);
                          if (venue.location) {
                            setForm((prev) => ({
                              ...prev,
                              property_id: venueId,
                              custom_venue_name: venue.name,
                              location_details: venue.location || prev.location_details,
                              max_attendees: venue.capacity ?? prev.max_attendees,
                            }));
                            setError(null);
                            setSuccess(null);
                          }
                        }
                      } else {
                        update("custom_venue_name", "");
                      }
                    }}
                    className={inputClass("property_id")}
                  >
                    <option value="">
                      {venuesLoaded
                        ? venues.length > 0
                          ? "Choose a venue..."
                          : "No venues available"
                        : "Loading venues..."}
                    </option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                        {venue.location ? ` — ${venue.location}` : ""}
                        {venue.capacity ? ` (up to ${venue.capacity})` : ""}
                      </option>
                    ))}
                  </select>

                  {/* Show selected venue details */}
                  {form.property_id && (() => {
                    const selected = venues.find((v) => v.id === form.property_id);
                    if (!selected) return null;
                    return (
                      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-sm space-y-1">
                        <p className="font-medium text-foreground">{selected.name}</p>
                        {selected.location && (
                          <p className="text-muted-foreground">{selected.location}</p>
                        )}
                        {selected.capacity && (
                          <p className="text-muted-foreground">Capacity: {selected.capacity} guests</p>
                        )}
                        {selected.description && (
                          <p className="text-muted-foreground line-clamp-2">{selected.description}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <input
                      id="custom_venue_name"
                      type="text"
                      value={form.custom_venue_name}
                      onChange={(e) => update("custom_venue_name", e.target.value)}
                      className={inputClass("custom_venue_name")}
                      placeholder="e.g. Blue Spirit Retreat Center, Nosara, Costa Rica"
                    />
                    {fieldError("custom_venue_name")}
                  </div>
                  <div>
                    <label htmlFor="location_details" className={labelClass}>
                      Location Details
                    </label>
                    <textarea
                      id="location_details"
                      value={form.location_details}
                      onChange={(e) => update("location_details", e.target.value)}
                      rows={3}
                      className={`${inputClass("location_details")} resize-none`}
                      placeholder="Directions, what to expect on arrival, nearby airports..."
                    />
                    {fieldError("location_details")}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Pricing */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Capacity & Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="max_attendees" className={labelClass}>
                  <Users className="w-4 h-4 inline mr-1" />
                  Max Attendees
                </label>
                <input
                  id="max_attendees"
                  type="number"
                  min={1}
                  value={form.max_attendees ?? ""}
                  onChange={(e) =>
                    update(
                      "max_attendees",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className={inputClass("max_attendees")}
                  placeholder="Leave blank for unlimited"
                />
                {fieldError("max_attendees")}
              </div>
              <div>
                <label htmlFor="price_per_person" className={labelClass}>
                  Your Rate Per Person (CAD)
                </label>
                <input
                  id="price_per_person"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price_per_person ?? ""}
                  onChange={(e) =>
                    update(
                      "price_per_person",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className={inputClass("price_per_person")}
                  placeholder="0.00"
                />
                {fieldError("price_per_person")}
                <p className="text-xs text-muted-foreground mt-1">
                  This is your per-person rate in Canadian dollars (CAD) and should cover all of your expenses outside of the platform (travel, materials, time, etc.). Each team member (venue, co-host, etc.) sets their own rate separately. A 25% platform fee is added on top of the combined total.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardContent className="space-y-5">
            <h2 className="text-lg font-display font-semibold">
              Retreat Details
            </h2>

            <div>
              <label htmlFor="what_you_offer" className={labelClass}>
                What You Offer
              </label>
              <textarea
                id="what_you_offer"
                value={form.what_you_offer}
                onChange={(e) => update("what_you_offer", e.target.value)}
                rows={4}
                className={`${inputClass("what_you_offer")} resize-none`}
                placeholder="Describe what attendees will experience: classes, workshops, meals, accommodation..."
              />
              {fieldError("what_you_offer")}
            </div>

            <div>
              <label htmlFor="what_to_bring" className={labelClass}>
                What to Bring
              </label>
              <textarea
                id="what_to_bring"
                value={form.what_to_bring}
                onChange={(e) => update("what_to_bring", e.target.value)}
                rows={3}
                className={`${inputClass("what_to_bring")} resize-none`}
                placeholder="Yoga mat, comfortable clothing, journal..."
              />
            </div>

          </CardContent>
        </Card>

        {/* Team Needs */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Handshake className="w-5 h-5 text-primary" /> Team Needs
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Looking for help? Select roles you need filled and add optional
                notes for each.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAM_NEEDS_OPTIONS.map((option) => {
                const isSelected = form.looking_for.needs.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        const needs = isSelected
                          ? prev.looking_for.needs.filter((n) => n !== option.id)
                          : [...prev.looking_for.needs, option.id];
                        const notes = { ...prev.looking_for.notes };
                        if (!isSelected) {
                          // keep existing note
                        } else {
                          delete notes[option.id];
                        }
                        return {
                          ...prev,
                          looking_for: { needs, notes },
                        };
                      });
                      setIsDirty(true);
                    }}
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

            {/* Notes for selected needs */}
            {form.looking_for.needs.length > 0 && (
              <div className="space-y-3">
                {form.looking_for.needs.map((needId) => {
                  const option = TEAM_NEEDS_OPTIONS.find((o) => o.id === needId);
                  if (!option) return null;
                  return (
                    <div key={needId}>
                      <label className={labelClass}>{option.label} — Notes</label>
                      <input
                        type="text"
                        value={form.looking_for.notes[needId] || ""}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            looking_for: {
                              ...prev.looking_for,
                              notes: {
                                ...prev.looking_for.notes,
                                [needId]: e.target.value,
                              },
                            },
                          }));
                          setIsDirty(true);
                        }}
                        className={inputClass()}
                        placeholder={`What are you looking for in a ${option.label.toLowerCase()}?`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Daily Schedule
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Build your retreat schedule day by day. Each day includes Morning, Midday, Afternoon, and Evening blocks.
              </p>
            </div>
            <ItineraryBuilder days={schedule} onChange={(days) => { setSchedule(days); setIsDirty(true); }} />
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

          {mode === "edit" && (status === "draft" || status === "pending_review") && (
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

          {mode === "edit" && (status === "draft" || status === "pending_review" || status === "cancelled") && (
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
              Delete Retreat
            </button>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
