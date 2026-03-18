"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { AppRole } from "@/types/auth";
import type { DashboardProfile } from "@/lib/queries/dashboard";

const roleLabels: Record<string, string> = {
  host: "Host",
  cohost: "Co-Host",
  landowner: "Venue Partner",
  staff: "Staff",
  attendee: "Attendee",
  admin: "Admin",
};

interface SharedProfileSectionProps {
  profile: DashboardProfile;
  roles: AppRole[];
  userEmail: string;
}

export default function SharedProfileSection({
  profile,
  roles,
  userEmail,
}: SharedProfileSectionProps) {
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {profile.profile_photo ? (
              <Image
                src={profile.profile_photo}
                alt={profile.name || "Profile"}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-lg font-bold text-primary">
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {profile.name || "Welcome"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {userEmail}
                </p>
              </div>
              <Button href="/account" size="sm" variant="outline" className="shrink-0 w-full sm:w-auto">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {roles.map((role) => (
                <Badge key={role} variant="muted">
                  {roleLabels[role] || role}
                </Badge>
              ))}
              {profile.is_coop_member ? (
                <Badge
                  className="bg-amber-500/10 text-amber-600 border border-amber-500/20"
                >
                  <Crown className="w-3 h-3 mr-1 inline" />
                  Co-Op Member
                </Badge>
              ) : (
                <Link
                  href="/cooperative"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-1"
                >
                  <Crown className="w-3 h-3" />
                  Join the Co-Op
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
