"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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

interface VenueTabProps {
  properties: DashboardProperty[];
}

export default function VenueTab({ properties }: VenueTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">My Properties</p>
              <p className="text-2xl font-bold">{properties.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">
                {properties.filter((p) => p.status === "published").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Property CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              Add a Property
            </h3>
            <p className="text-sm text-muted-foreground">
              List your venue and connect with retreat hosts worldwide.
            </p>
          </div>
          <Button href="/host/venues/new" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Property
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          My Properties
        </h2>
        {properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t listed any properties yet.
              </p>
              <Button href="/host/venues/new" size="sm">
                List Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <Link key={property.id} href={`/venues/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4">
                    {property.photos[0] && (
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={property.photos[0]}
                          alt={property.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">
                          {property.name}
                        </h4>
                        <Badge variant={statusVariant[property.status || ""] || "muted"}>
                          {property.status === "pending_review"
                            ? "Pending Review"
                            : property.status || "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {typeLabels[property.property_type] || "Venue"}
                        </span>
                        {property.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
