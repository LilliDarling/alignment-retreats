"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, BadgeCheck, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import SupportButton from "@/components/ui/SupportButton";
import { formatPrice, formatDateRange } from "@/lib/utils/format";
import type { Retreat } from "@/lib/types";

const ROLE_INCLUDED_LABELS: Record<string, string> = {
  host: "Hosting & facilitation",
  venue: "Venue access & accommodations",
  cohost: "Co-host support",
  chef: "Chef & catering",
  photographer: "Photography & videography",
  yoga_instructor: "Yoga instruction",
  sound_healer: "Sound healing sessions",
  massage: "Massage therapy",
  staff: "On-site staff support",
  other: "Additional services",
};

interface BookingSidebarProps {
  retreat: Retreat;
  isAuthenticated?: boolean;
}

export default function BookingSidebar({ retreat, isAuthenticated }: BookingSidebarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Build "what's included" from team members + always include host
  const includedRoles = new Set<string>(["host"]);
  if (retreat.property) includedRoles.add("venue");
  if (retreat.teamMembers) {
    for (const tm of retreat.teamMembers) {
      if (tm.role !== "other") includedRoles.add(tm.role);
    }
  }

  async function handleBook() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/retreats/${retreat.slug}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (sessionData?.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "process-booking-payment",
        {
          body: {
            retreat_id: retreat.id,
            success_url: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/retreats/${retreat.slug}`,
          },
          headers,
        }
      );

      if (fnError) throw fnError;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError("Unable to start checkout. Please try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-border overflow-hidden">
      {/* Price Header */}
      <div className="p-6 pb-0">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(retreat.price, retreat.currency)}
          </span>
          <span className="text-sm text-muted-foreground">/ person</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDateRange(retreat.startDate, retreat.endDate)} &middot;{" "}
          {retreat.duration}
        </p>
        {retreat.spotsLeft && (
          <p className="text-sm text-amber-600 font-medium mt-1">
            {retreat.spotsLeft} spots remaining
          </p>
        )}
      </div>

      {/* What's Included Toggle */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
        >
          What&apos;s included
          {showBreakdown ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2">
            {[...includedRoles].map((role) => (
              <div key={role} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{ROLE_INCLUDED_LABELS[role] || role}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Secure checkout, scheduling & support</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 pt-1">
              All team members set their own independent rates. A 25% platform fee is included in the total. All prices are in Canadian dollars (CAD).
            </p>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="px-6 py-4">
        <div className="flex justify-between border-t border-border pt-3 text-sm">
          <span className="font-semibold text-foreground">Total per person</span>
          <span className="font-bold text-primary text-lg">
            {formatPrice(retreat.price, retreat.currency)}
          </span>
        </div>
      </div>

      {/* Book Now */}
      <div className="px-6 pb-4">
        <Button
          type="button"
          className="w-full"
          onClick={handleBook}
          disabled={loading || !retreat.price}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to checkout...
            </>
          ) : isAuthenticated ? (
            "Reserve Spot"
          ) : (
            "Sign In to Book"
          )}
        </Button>
        {error && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}
        <p className="text-center text-xs text-muted-foreground mt-3">
          Secure checkout powered by Stripe
        </p>
        <p className="text-center text-[11px] text-muted-foreground/70 mt-1">
          All prices are in Canadian dollars (CAD)
        </p>
      </div>

      {/* Support */}
      <div className="px-6 pb-2">
        <SupportButton variant="link" className="text-muted-foreground text-xs justify-center w-full" label="Have a question? Get support" />
      </div>

      {/* Trust Badges */}
      <div className="px-6 pb-6 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <BadgeCheck className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Verified Host</p>
            <p className="text-[11px] text-muted-foreground">
              Identity and credentials verified
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Secure Payment
            </p>
            <p className="text-[11px] text-muted-foreground">
              256-bit SSL encrypted transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
