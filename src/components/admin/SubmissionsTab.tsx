"use client";

import { useState } from "react";
import Image from "next/image";
import { parseLocalDate } from "@/lib/utils/format";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Mail,
  Mountain,
  ImageIcon,
  Video,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { approveRetreat, rejectRetreat } from "@/lib/actions/admin";
import { parseItineraryText } from "@/lib/utils/itinerary";
import ItineraryTimeline from "@/components/retreats/ItineraryTimeline";
import type { PendingRetreat } from "@/lib/queries/admin";

interface SubmissionsTabProps {
  retreats: PendingRetreat[];
}

export default function SubmissionsTab({ retreats: initial }: SubmissionsTabProps) {
  const [retreats, setRetreats] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  if (retreats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mountain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No pending submissions</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            All retreat submissions have been reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = async (id: string) => {
    setLoading(id);
    setFeedback(null);
    const result = await approveRetreat(id, notes[id]);
    if (result.error) {
      setFeedback({ id, msg: result.error, type: "error" });
    } else {
      setRetreats((prev) => prev.filter((r) => r.id !== id));
      setFeedback({ id, msg: "Retreat approved! It will appear in the Approved tab for team building.", type: "success" });
    }
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to decline this submission?")) return;
    setLoading(id);
    setFeedback(null);
    const result = await rejectRetreat(id, notes[id]);
    if (result.error) {
      setFeedback({ id, msg: result.error, type: "error" });
    } else {
      setRetreats((prev) => prev.filter((r) => r.id !== id));
      setFeedback({ id, msg: "Retreat declined.", type: "success" });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {retreats.length} submission{retreats.length !== 1 ? "s" : ""} pending
        review
      </p>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-sm ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {retreats.map((retreat) => {
        const isExpanded = expandedId === retreat.id;
        const hasGalleryImages = retreat.gallery_images.length > 0;
        const hasGalleryVideos = retreat.gallery_videos.length > 0;
        const hasMedia = retreat.main_image || hasGalleryImages || hasGalleryVideos;
        const allImages = [
          ...(retreat.main_image ? [retreat.main_image] : []),
          ...retreat.gallery_images,
        ];
        const itineraryDays = retreat.sample_itinerary
          ? parseItineraryText(retreat.sample_itinerary)
          : [];

        return (
          <Card key={retreat.id}>
            <CardContent className="p-0">
              {/* Header Row */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : retreat.id)
                }
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {retreat.main_image && (
                  <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={retreat.main_image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {retreat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    by {retreat.host_name || "Unknown Host"} ·{" "}
                    {retreat.retreat_type}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {hasGalleryImages && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ImageIcon className="w-3 h-3" />
                      {retreat.gallery_images.length}
                    </span>
                  )}
                  {hasGalleryVideos && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Video className="w-3 h-3" />
                      {retreat.gallery_videos.length}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                    Pending
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  {/* Key Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <DetailItem
                      icon={Calendar}
                      label="Dates"
                      value={`${formatDate(retreat.start_date)} – ${formatDate(retreat.end_date)}`}
                    />
                    <DetailItem
                      icon={MapPin}
                      label="Location"
                      value={retreat.custom_venue_name || "No venue"}
                    />
                    <DetailItem
                      icon={Users}
                      label="Max Attendees"
                      value={
                        retreat.max_attendees?.toString() || "Not specified"
                      }
                    />
                    <DetailItem
                      icon={DollarSign}
                      label="Price / Person"
                      value={
                        retreat.price_per_person
                          ? `$${retreat.price_per_person}`
                          : "Free"
                      }
                    />
                  </div>

                  {/* Media Gallery */}
                  {hasMedia && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Media</h4>

                      {/* Cover + Gallery Images */}
                      {allImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                          {allImages.map((url, i) => (
                            <button
                              key={`img-${i}`}
                              onClick={() => setLightbox({ images: allImages, index: i })}
                              className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                            >
                              <Image
                                src={url}
                                alt={i === 0 && retreat.main_image ? "Cover image" : `Gallery photo ${i}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 33vw, 200px"
                              />
                              {i === 0 && retreat.main_image && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white">
                                  Cover
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Gallery Videos */}
                      {hasGalleryVideos && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {retreat.gallery_videos.map((url, i) => (
                            <div
                              key={`vid-${i}`}
                              className="relative aspect-video rounded-lg overflow-hidden bg-black"
                            >
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                                preload="metadata"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {retreat.description}
                    </p>
                  </div>

                  {/* What You Offer */}
                  {retreat.what_you_offer && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        What&apos;s Offered
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {retreat.what_you_offer}
                      </p>
                    </div>
                  )}

                  {/* What to Bring */}
                  {retreat.what_to_bring && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        What to Bring
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {retreat.what_to_bring}
                      </p>
                    </div>
                  )}

                  {/* Location Details */}
                  {retreat.location_details && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Location Details
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {retreat.location_details}
                      </p>
                    </div>
                  )}

                  {/* Sample Itinerary */}
                  {itineraryDays.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">
                        Daily Schedule
                      </h4>
                      <ItineraryTimeline days={itineraryDays} />
                    </div>
                  )}

                  {/* Host Info */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <h4 className="text-sm font-semibold mb-2">
                      Host Information
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {retreat.host_name
                          ? retreat.host_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {retreat.host_name || "Unknown"}
                        </p>
                        {retreat.host_email && (
                          <a
                            href={`mailto:${retreat.host_email}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            {retreat.host_email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="text-sm font-semibold block mb-1">
                      Admin Notes (internal)
                    </label>
                    <textarea
                      value={notes[retreat.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [retreat.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Optional notes about this submission..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(retreat.id)}
                      disabled={loading === retreat.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading === retreat.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(retreat.id)}
                      disabled={loading === retreat.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.images[lightbox.index]}
              alt={`Photo ${lightbox.index + 1}`}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer text-xl"
            >
              ×
            </button>
            {lightbox.images.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index:
                              (prev.index - 1 + prev.images.length) %
                              prev.images.length,
                          }
                        : null
                    )
                  }
                  className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto cursor-pointer text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.images.length,
                          }
                        : null
                    )
                  }
                  className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto cursor-pointer text-xl"
                >
                  ›
                </button>
              </div>
            )}
            <p className="text-center text-white/60 text-sm mt-3">
              {lightbox.index + 1} / {lightbox.images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
