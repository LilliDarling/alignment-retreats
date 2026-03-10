"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PartyPopper, Calendar, ArrowRight, Home } from "lucide-react";
import Button from "@/components/ui/Button";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-display text-foreground mb-4">
          Page Not Found
        </h1>
        <Link href="/retreats">
          <Button>Browse Retreats</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <div className="bg-white rounded-[16px] border border-border shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <PartyPopper className="w-16 h-16 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-display text-foreground mb-2">
          Booking Confirmed!
        </h1>

        <p className="text-muted-foreground text-lg mb-8">
          Your retreat has been booked successfully. We can&apos;t wait to see
          you there!
        </p>

        <div className="bg-muted rounded-xl p-6 text-left mb-8">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>
                    You&apos;ll receive a confirmation email with your booking
                    details
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>
                    The retreat host will reach out with more information
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Get ready for a transformative experience!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/retreats" className="block">
            <Button className="w-full">Browse More Retreats</Button>
          </Link>
          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">Loading...</div>
        }
      >
        <ThankYouContent />
      </Suspense>
    </div>
  );
}
