"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, BadgeCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { formatPrice, formatDateRange } from "@/lib/utils/format";
import type { Retreat } from "@/lib/types";

interface BookingSidebarProps {
  retreat: Retreat;
  isAuthenticated?: boolean;
}

export default function BookingSidebar({ retreat, isAuthenticated }: BookingSidebarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* Price Display */}
      <div className="px-6 py-4">
        <div className="flex justify-between border-t border-border pt-3 text-sm">
          <span className="font-semibold text-foreground">Total</span>
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
