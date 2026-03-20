"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPin,
  Users,
  Loader2,
  Mail,
  Home,
  Instagram,
  ExternalLink,
  Globe,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { approveProperty, rejectProperty, unpublishProperty } from "@/lib/actions/admin";
import { AMENITY_OPTIONS, FEATURE_OPTIONS, PROPERTY_TYPES } from "@/lib/constants/venue";
import type { PendingProperty, PublishedProperty } from "@/lib/queries/admin";

const amenityLabelMap = Object.fromEntries(AMENITY_OPTIONS.map((a) => [a.id, a.label]));
const featureLabelMap = Object.fromEntries(FEATURE_OPTIONS.map((f) => [f.id, f.label]));
const propertyTypeLabel = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));

function formatLabel(value: string, map: Record<string, string>): string {
  return map[value] || value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Lightbox {
  photos: string[];
  index: number;
}

function PhotoLightbox({ lightbox, onClose, onNav }: {
  lightbox: Lightbox;
  onClose: () => void;
  onNav: (dir: 1 | -1) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
      >
        <X className="w-6 h-6" />
      </button>
      {lightbox.photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNav(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/30 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNav(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 bg-black/30 rounded-full"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </>
      )}
      <div
        className="relative max-w-4xl max-h-[85vh] w-full mx-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={lightbox.photos[lightbox.index]}
          alt={`Photo ${lightbox.index + 1}`}
          width={1200}
          height={800}
          className="object-contain w-full max-h-[85vh] rounded-xl"
        />
        {lightbox.photos.length > 1 && (
          <p className="text-center text-white/50 text-sm mt-2">
            {lightbox.index + 1} / {lightbox.photos.length}
          </p>
        )}
      </div>
    </div>
  );
}

interface PropertiesTabProps {
  properties: PendingProperty[];
  publishedProperties: PublishedProperty[];
}

export default function PropertiesTab({ properties: initial, publishedProperties: initialPublished }: PropertiesTabProps) {
  const [properties, setProperties] = useState(initial);
  const [published, setPublished] = useState(initialPublished);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedPublishedId, setExpandedPublishedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    setFeedback(null);
    const result = await approveProperty(id);
    if (result.error) {
      setFeedback({ msg: result.error, type: "error" });
    } else {
      const approved = properties.find((p) => p.id === id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      if (approved) {
        setPublished((prev) => [{
          id: approved.id,
          name: approved.name,
          property_type: approved.property_type,
          location: approved.location,
          capacity: approved.capacity,
          photos: approved.photos,
          status: "published",
          owner_name: approved.owner_name,
          owner_email: approved.owner_email,
          contact_name: approved.contact_name,
          contact_email: approved.contact_email,
          instagram_handle: approved.instagram_handle,
          tiktok_handle: approved.tiktok_handle,
        }, ...prev]);
      }
      setFeedback({ msg: "Property approved and published!", type: "success" });
      setExpandedId(null);
    }
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this property?")) return;
    setLoading(id);
    setFeedback(null);
    const result = await rejectProperty(id, adminNotes[id]);
    if (result.error) {
      setFeedback({ msg: result.error, type: "error" });
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setFeedback({ msg: "Property rejected.", type: "success" });
      setExpandedId(null);
    }
    setLoading(null);
  };

  const handleUnpublish = async (id: string) => {
    if (!confirm("Unpublish this property? It will return to pending review.")) return;
    setLoading(id);
    setFeedback(null);
    const result = await unpublishProperty(id);
    if (result.error) {
      setFeedback({ msg: result.error, type: "error" });
    } else {
      const unpublished = published.find((p) => p.id === id);
      setPublished((prev) => prev.filter((p) => p.id !== id));
      if (unpublished) {
        setProperties((prev) => [{
          id: unpublished.id,
          name: unpublished.name,
          property_type: unpublished.property_type,
          location: unpublished.location,
          capacity: unpublished.capacity,
          description: null,
          amenities: [],
          photos: unpublished.photos,
          videos: [],
          status: "pending_review",
          created_at: new Date().toISOString(),
          owner_user_id: "",
          owner_name: unpublished.owner_name,
          owner_email: unpublished.owner_email,
          contact_name: unpublished.contact_name,
          contact_email: unpublished.contact_email,
          instagram_handle: unpublished.instagram_handle,
          tiktok_handle: unpublished.tiktok_handle,
          property_features: [],
        }, ...prev]);
      }
      setFeedback({ msg: "Property unpublished and returned to pending review.", type: "success" });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-8">
      {lightbox && (
        <PhotoLightbox
          lightbox={lightbox}
          onClose={() => setLightbox(null)}
          onNav={(dir) =>
            setLightbox((lb) =>
              lb
                ? { ...lb, index: (lb.index + dir + lb.photos.length) % lb.photos.length }
                : null
            )
          }
        />
      )}

      {feedback && (
        <div className={`p-3 rounded-xl text-sm ${
          feedback.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Pending section */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          Pending Review
          <span className="text-sm font-normal text-muted-foreground ml-1">
            ({properties.length})
          </span>
        </h2>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Home className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending properties</p>
              <p className="text-sm text-muted-foreground/60 mt-1">All property submissions have been reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => {
            const isExpanded = expandedId === property.id;
            return (
              <Card key={property.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : property.id)}
                    className="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    {property.photos.length > 0 ? (
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                        <Image src={property.photos[0]} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{property.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatLabel(property.property_type, propertyTypeLabel)} · {property.location || "No location"} · by {property.owner_name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Pending</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-5 py-5 space-y-5">
                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
                            <MapPin className="w-3 h-3" /> Location
                          </p>
                          <p className="text-sm font-medium">{property.location || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
                            <Users className="w-3 h-3" /> Capacity
                          </p>
                          <p className="text-sm font-medium">{property.capacity ? `${property.capacity} guests` : "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Type</p>
                          <p className="text-sm font-medium">{formatLabel(property.property_type, propertyTypeLabel)}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {property.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{property.description}</p>
                        </div>
                      )}

                      {/* Photos */}
                      {property.photos.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Photos ({property.photos.length})</h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {property.photos.map((url, i) => (
                              <button
                                key={i}
                                onClick={() => setLightbox({ photos: property.photos, index: i })}
                                className="relative aspect-video rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-zoom-in"
                              >
                                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="200px" />
                                {i === 0 && (
                                  <span className="absolute top-1 left-1 bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">Cover</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos */}
                      {property.videos.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Videos ({property.videos.length})</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {property.videos.map((url, i) => (
                              <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-black">
                                <video src={url} className="w-full h-full object-cover" controls playsInline />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {property.amenities.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.amenities.map((a) => (
                              <span key={a} className="px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground border border-border">
                                {formatLabel(a, amenityLabelMap)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      {property.property_features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Special Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {property.property_features.map((f) => (
                              <span key={f} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                                {formatLabel(f, featureLabelMap)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Owner / Contact */}
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <h4 className="text-sm font-semibold mb-2">Owner / Contact</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-muted-foreground">Owner:</span> {property.owner_name || "Unknown"}</p>
                          {property.owner_email && (
                            <a href={`mailto:${property.owner_email}`} className="text-primary hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {property.owner_email}
                            </a>
                          )}
                          {property.contact_name && (
                            <p><span className="text-muted-foreground">Contact:</span> {property.contact_name}</p>
                          )}
                          {property.contact_email && (
                            <a href={`mailto:${property.contact_email}`} className="text-primary hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {property.contact_email}
                            </a>
                          )}
                          {property.instagram_handle && (
                            <a
                              href={`https://instagram.com/${property.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Instagram className="w-3 h-3" /> @{property.instagram_handle}
                            </a>
                          )}
                          {property.tiktok_handle && (
                            <a
                              href={`https://tiktok.com/@${property.tiktok_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="w-3 h-3 text-[10px] font-bold flex items-center justify-center">TK</span>
                              @{property.tiktok_handle}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Admin notes */}
                      <div>
                        <label className="text-sm font-semibold block mb-1.5">Admin Notes (sent on rejection)</label>
                        <textarea
                          value={adminNotes[property.id] || ""}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [property.id]: e.target.value }))}
                          placeholder="Optional notes for the owner..."
                          rows={3}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          onClick={() => handleApprove(property.id)}
                          disabled={loading === property.id}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {loading === property.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Approve &amp; Publish
                        </button>
                        <button
                          onClick={() => handleReject(property.id)}
                          disabled={loading === property.id}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                        <Link
                          href={`/venues/${property.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview listing
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Published section */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-600" />
          Published Venues
          <span className="text-sm font-normal text-muted-foreground ml-1">({published.length})</span>
        </h2>

        {published.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No published venues yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {published.map((property) => {
              const isPubExpanded = expandedPublishedId === property.id;
              return (
                <Card key={property.id}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedPublishedId(isPubExpanded ? null : property.id)}
                      className="w-full flex items-center gap-4 p-4 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      {property.photos.length > 0 ? (
                        <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                          <Image src={property.photos[0]} alt="" fill className="object-cover" sizes="56px" />
                        </div>
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Home className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{property.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatLabel(property.property_type, propertyTypeLabel)}
                          {property.location ? ` · ${property.location}` : ""}
                          {property.capacity ? ` · ${property.capacity} guests` : ""}
                          {property.owner_name ? ` · ${property.owner_name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Published</span>
                        {isPubExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isPubExpanded && (
                      <div className="border-t border-border px-5 py-4 space-y-4">
                        {/* Owner / Contact */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <h4 className="text-sm font-semibold mb-2">Owner / Contact</h4>
                          <div className="space-y-1.5 text-sm">
                            <p><span className="text-muted-foreground">Owner:</span> {property.owner_name || "Unknown"}</p>
                            {property.owner_email && (
                              <a href={`mailto:${property.owner_email}`} className="text-primary hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {property.owner_email}
                              </a>
                            )}
                            {property.contact_name && (
                              <p><span className="text-muted-foreground">Contact:</span> {property.contact_name}</p>
                            )}
                            {property.contact_email && (
                              <a href={`mailto:${property.contact_email}`} className="text-primary hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {property.contact_email}
                              </a>
                            )}
                            {property.instagram_handle && (
                              <a
                                href={`https://instagram.com/${property.instagram_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <Instagram className="w-3 h-3" /> @{property.instagram_handle}
                              </a>
                            )}
                            {property.tiktok_handle && (
                              <a
                                href={`https://tiktok.com/@${property.tiktok_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <span className="w-3 h-3 text-[10px] font-bold flex items-center justify-center">TK</span>
                                @{property.tiktok_handle}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/venues/${property.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View listing
                          </Link>
                          <button
                            onClick={() => handleUnpublish(property.id)}
                            disabled={loading === property.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer border border-border"
                          >
                            {loading === property.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Unpublish
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
