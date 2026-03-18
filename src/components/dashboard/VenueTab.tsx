"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Plus, MapPin, Eye, Pencil, Clock, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { deleteProperty } from "@/lib/actions/venue";
import type { DashboardProperty } from "@/lib/queries/dashboard";

const typeLabels: Record<string, string> = {
  retreat_center: "Retreat Center",
  venue: "Venue",
  land: "Land",
};

const statusVariant: Record<string, "primary" | "muted" | "warning" | "outline"> = {
  published: "primary",
  pending_review: "warning",
  draft: "muted",
};

const statusLabel: Record<string, string> = {
  published: "Published",
  pending_review: "Pending Review",
  draft: "Draft",
};

interface VenueTabProps {
  properties: DashboardProperty[];
}

export default function VenueTab({ properties }: VenueTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await deleteProperty(id);
    setDeletingId(null);
  };

  const published = properties.filter((p) => p.status === "published").length;
  const pending = properties.filter((p) => p.status === "pending_review").length;
  const drafts = properties.filter((p) => p.status === "draft" || !p.status).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{properties.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-green-100">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-xl font-bold">{published}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-muted">
              <Pencil className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-xl font-bold">{drafts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Property CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              List a Property
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your venue with retreat hosts worldwide.
            </p>
          </div>
          <Button href="/venues/new" size="sm" className="shrink-0 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" />
            New Property
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">My Properties</h2>
        {properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t listed any properties yet.
              </p>
              <Button href="/venues/new" size="sm">
                List Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {property.photos[0] ? (
                    <div className="relative w-full h-32 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={property.photos[0]}
                        alt={property.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 80px"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 sm:w-20 sm:h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">{property.name}</h4>
                      <Badge variant={statusVariant[property.status || ""] || "muted"}>
                        {statusLabel[property.status || ""] || "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{typeLabels[property.property_type] || "Venue"}</span>
                      {property.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/venues/${property.id}/edit`}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      title="Edit property"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/venues/${property.id}`}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      title={property.status === "published" ? "View public listing" : "Preview listing"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {(property.status === "draft" || property.status === "pending_review") && (
                      <button
                        onClick={() => handleDelete(property.id, property.name)}
                        disabled={deletingId === property.id}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                        title="Delete property"
                      >
                        {deletingId === property.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
