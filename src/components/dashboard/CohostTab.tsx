"use client";

import Link from "next/link";
import {
  Search,
  Handshake,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { parseLocalDate } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { CohostCollaboration } from "@/types/dashboard";

const roleLabels: Record<string, string> = {
  cohost: "Co-Host",
  chef: "Chef",
  photographer: "Photographer",
  yoga_instructor: "Yoga Instructor",
  sound_healer: "Sound Healer",
  massage: "Massage Therapist",
  staff: "Staff",
  other: "Other",
};

function feeLabel(feeType: string): string {
  switch (feeType) {
    case "per_person":
      return "/person";
    case "per_night":
      return "/night";
    case "per_person_per_night":
      return "/person/night";
    case "flat":
      return " flat";
    case "percentage":
      return "%";
    default:
      return "";
  }
}

interface CohostTabProps {
  collaborations: CohostCollaboration[];
}

export default function CohostTab({ collaborations }: CohostTabProps) {
  const accepted = collaborations.filter((c) => c.agreed);
  const pending = collaborations.filter((c) => !c.agreed);
  const upcoming = accepted.filter(
    (c) => c.retreat_start && new Date(c.retreat_start) > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Handshake className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{collaborations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="text-xl font-bold">{accepted.length}</p>
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
              <p className="text-xl font-bold">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-xl font-bold">{upcoming.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Find Opportunities CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              Find Opportunities
            </h3>
            <p className="text-sm text-muted-foreground">
              Browse retreats looking for co-hosts and collaborators.
            </p>
          </div>
          <Button href="/retreats" size="sm" className="shrink-0 w-full sm:w-auto">
            <Search className="w-4 h-4 mr-1" />
            Browse Retreats
          </Button>
        </CardContent>
      </Card>

      {/* Collaborations List */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          My Collaborations
        </h2>
        {collaborations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No collaborations yet. Browse retreats to find opportunities to
                partner with hosts.
              </p>
              <Button href="/retreats" size="sm">
                Browse Retreats
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {collaborations.map((collab) => (
              <Link
                key={collab.id}
                href={`/retreats/${collab.retreat_slug}`}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold truncate">
                          {collab.retreat_title}
                        </h4>
                        <Badge
                          variant={collab.agreed ? "primary" : "warning"}
                        >
                          {collab.agreed ? "Accepted" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Handshake className="w-3 h-3" />
                          {roleLabels[collab.role] || collab.role}
                        </span>
                        {collab.fee_amount > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {collab.fee_type === "percentage"
                              ? `${collab.fee_amount}${feeLabel(collab.fee_type)}`
                              : `$${collab.fee_amount.toLocaleString()}${feeLabel(collab.fee_type)}`}
                          </span>
                        )}
                        {collab.retreat_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {collab.retreat_location}
                          </span>
                        )}
                        {collab.retreat_start && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {parseLocalDate(collab.retreat_start).toLocaleDateString()}
                            {collab.retreat_end &&
                              ` – ${parseLocalDate(collab.retreat_end).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
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
