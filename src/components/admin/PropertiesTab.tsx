"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPin,
  Users,
  DollarSign,
  Loader2,
  Mail,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { approveProperty, rejectProperty } from "@/lib/actions/admin";
import type { PendingProperty } from "@/lib/queries/admin";

interface PropertiesTabProps {
  properties: PendingProperty[];
}

export default function PropertiesTab({
  properties: initial,
}: PropertiesTabProps) {
  const [properties, setProperties] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No pending properties</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            All property submissions have been reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = async (id: string) => {
    setLoading(id);
    setFeedback(null);
    const result = await approveProperty(id);
    if (result.error) {
      setFeedback({ msg: result.error, type: "error" });
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setFeedback({ msg: "Property approved and published!", type: "success" });
    }
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this property?")) return;
    setLoading(id);
    setFeedback(null);
    const result = await rejectProperty(id);
    if (result.error) {
      setFeedback({ msg: result.error, type: "error" });
    } else {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setFeedback({ msg: "Property rejected.", type: "success" });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {properties.length} propert{properties.length !== 1 ? "ies" : "y"}{" "}
        pending review
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

      {properties.map((property) => {
        const isExpanded = expandedId === property.id;
        return (
          <Card key={property.id}>
            <CardContent className="p-0">
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : property.id)
                }
                className="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
              >
                {property.photos.length > 0 && (
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={property.photos[0]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">
                    {property.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {property.property_type} · {property.location || "No location"}{" "}
                    · by {property.owner_name || "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
                        <MapPin className="w-3 h-3" />
                        Location
                      </p>
                      <p className="text-sm font-medium">
                        {property.location || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
                        <Users className="w-3 h-3" />
                        Capacity
                      </p>
                      <p className="text-sm font-medium">
                        {property.capacity
                          ? `${property.capacity} guests`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1 mb-0.5">
                        <DollarSign className="w-3 h-3" />
                        Base Price
                      </p>
                      <p className="text-sm font-medium">
                        {property.base_price
                          ? `$${property.base_price}`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                        Type
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {property.property_type}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  {property.amenities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((a, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground border border-border"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {property.property_features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.property_features.map((f, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {property.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Photos</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {property.photos.map((url, i) => (
                          <div
                            key={i}
                            className="relative aspect-video rounded-lg overflow-hidden"
                          >
                            <Image
                              src={url}
                              alt={`${property.name} photo ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Owner Info */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <h4 className="text-sm font-semibold mb-2">
                      Owner / Contact
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Owner:</span>{" "}
                        {property.owner_name || "Unknown"}
                      </p>
                      {property.owner_email && (
                        <a
                          href={`mailto:${property.owner_email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {property.owner_email}
                        </a>
                      )}
                      {property.contact_name && (
                        <p>
                          <span className="text-muted-foreground">
                            Contact:
                          </span>{" "}
                          {property.contact_name}
                        </p>
                      )}
                      {property.contact_email && (
                        <a
                          href={`mailto:${property.contact_email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {property.contact_email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(property.id)}
                      disabled={loading === property.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading === property.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
