"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Calendar, MapPin, Pencil, Clock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { HostRetreat } from "@/lib/queries/dashboard";

const statusVariant: Record<string, "primary" | "muted" | "outline" | "warning"> = {
  published: "primary",
  draft: "muted",
  pending_review: "warning",
  full: "warning",
  completed: "outline",
  cancelled: "outline",
};

const statusLabel: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  pending_review: "Pending Review",
  full: "Full",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface HostTabProps {
  retreats: HostRetreat[];
}

export default function HostTab({ retreats }: HostTabProps) {
  const published = retreats.filter((r) => r.status === "published").length;
  const drafts = retreats.filter((r) => r.status === "draft").length;
  const pending = retreats.filter((r) => r.status === "pending_review").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{retreats.length}</p>
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

      {/* Create CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              Create a New Retreat
            </h3>
            <p className="text-sm text-muted-foreground">
              Share your next transformative experience with the community.
            </p>
          </div>
          <Button href="/host/retreats/new" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Retreat
          </Button>
        </CardContent>
      </Card>

      {/* Retreats List */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          My Retreats
        </h2>
        {retreats.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any retreats yet.
              </p>
              <Button href="/host/retreats/new" size="sm">
                Create Your First Retreat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {retreats.map((retreat) => (
              <Card
                key={retreat.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="flex items-center gap-4">
                  {retreat.main_image && (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={retreat.main_image}
                        alt={retreat.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {retreat.title}
                      </h4>
                      <Badge
                        variant={statusVariant[retreat.status] || "muted"}
                      >
                        {statusLabel[retreat.status] || retreat.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {retreat.custom_venue_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {retreat.custom_venue_name}
                        </span>
                      )}
                      {retreat.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(retreat.start_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/host/retreats/${retreat.id}/edit`}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      title="Edit retreat"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/retreats/${retreat.slug}`}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      title={retreat.status === "published" ? "View public page" : "Preview retreat"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
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
