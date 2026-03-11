import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getMyBookings } from "@/lib/queries/dashboard";
import { parseLocalDate } from "@/lib/utils/format";
import { CalendarCheck, Calendar, MapPin, ArrowRight, Mountain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "My Bookings | Alignment Retreats",
};

function getBookingStatus(
  retreatStatus: string,
  startDate: string | null,
  endDate: string | null
): { label: string; variant: "primary" | "muted" | "warning" | "outline" } {
  if (retreatStatus === "cancelled") return { label: "Cancelled", variant: "outline" };
  const now = new Date();
  if (endDate && new Date(endDate) < now) return { label: "Completed", variant: "outline" };
  if (startDate && new Date(startDate) <= now) return { label: "In Progress", variant: "primary" };
  return { label: "Upcoming", variant: "warning" };
}

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/bookings");

  const bookings = await getMyBookings(user.id);

  const upcoming = bookings.filter((b) => {
    if (b.retreat_status === "cancelled") return false;
    const end = b.retreat_end ? new Date(b.retreat_end) : null;
    return !end || end >= new Date();
  });
  const past = bookings.filter((b) => {
    if (b.retreat_status === "cancelled") return true;
    const end = b.retreat_end ? new Date(b.retreat_end) : null;
    return end && end < new Date();
  });

  return (
    <main className="pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              My Bookings
            </h1>
            <p className="text-sm text-muted-foreground">
              {bookings.length === 0
                ? "No bookings yet"
                : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Mountain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No bookings yet
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                When you book a retreat, it will appear here.
              </p>
              <Button href="/retreats" size="sm">
                Browse Retreats
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Upcoming & Active
                </h2>
                <div className="space-y-3">
                  {upcoming.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Past & Cancelled
                </h2>
                <div className="space-y-3">
                  {past.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} muted />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function BookingCard({
  booking,
  muted = false,
}: {
  booking: Awaited<ReturnType<typeof getMyBookings>>[number];
  muted?: boolean;
}) {
  const { label, variant } = getBookingStatus(
    booking.retreat_status,
    booking.retreat_start,
    booking.retreat_end
  );

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return parseLocalDate(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className={muted ? "opacity-70" : "hover:shadow-md transition-shadow"}>
      <CardContent className="flex items-center gap-4">
        {/* Image */}
        {booking.retreat_image ? (
          <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0">
            <Image
              src={booking.retreat_image}
              alt={booking.retreat_title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div className="w-20 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
            <Mountain className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">
              {booking.retreat_title}
            </h3>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {booking.retreat_location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.retreat_location}
              </span>
            )}
            {(booking.retreat_start || booking.retreat_end) && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {booking.retreat_start && formatDate(booking.retreat_start)}
                {booking.retreat_start && booking.retreat_end && " – "}
                {booking.retreat_end && formatDate(booking.retreat_end)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Booked{" "}
            {new Date(booking.booking_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Action */}
        <Link
          href={`/retreats/${booking.retreat_slug}`}
          className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          title="View retreat"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
