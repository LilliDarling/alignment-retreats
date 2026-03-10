"use client";

import { formatDateRange } from "@/lib/utils/format";
import type { Retreat } from "@/lib/types";

interface MobileBookingBarProps {
  retreat: Retreat;
}

export default function MobileBookingBar({ retreat }: MobileBookingBarProps) {
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="text-xl font-bold text-primary">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: retreat.currency,
                minimumFractionDigits: 0,
              }).format(retreat.price)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ person</span>
            <p className="text-xs text-muted-foreground">
              {formatDateRange(retreat.startDate, retreat.endDate)}
            </p>
          </div>
          <a
            href="#booking-sidebar"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("booking-sidebar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-[30px] text-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Book Now
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </>
  );
}
