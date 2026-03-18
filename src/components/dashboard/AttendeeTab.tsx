"use client";

import { Heart, Calendar, Search, ArrowRight } from "lucide-react";
import { parseLocalDate } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { DashboardBooking } from "@/lib/queries/dashboard";

interface AttendeeTabProps {
  bookings: DashboardBooking[];
}

export default function AttendeeTab({ bookings }: AttendeeTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">My Bookings</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">
                {
                  bookings.filter(
                    (b) =>
                      b.retreat_start &&
                      new Date(b.retreat_start) > new Date()
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {
                  bookings.filter(
                    (b) =>
                      b.retreat_end && new Date(b.retreat_end) < new Date()
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">
              Find Your Next Retreat
            </h3>
            <p className="text-sm text-muted-foreground">
              Discover transformative experiences curated by our community.
            </p>
          </div>
          <Button href="/retreats" size="sm" className="shrink-0 w-full sm:w-auto">
            <Search className="w-4 h-4 mr-1" />
            Browse Retreats
          </Button>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">
          My Bookings
        </h2>
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t booked any retreats yet.
              </p>
              <Button href="/retreats" size="sm">
                Browse Retreats
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                      {booking.retreat_title || "Untitled Retreat"}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {booking.retreat_start && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {parseLocalDate(booking.retreat_start).toLocaleDateString()}
                          {booking.retreat_end &&
                            ` – ${parseLocalDate(booking.retreat_end).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
