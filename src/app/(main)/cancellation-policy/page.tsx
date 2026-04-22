import { RefreshCw } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | Alignment Retreats",
  description:
    "How Alignment Retreats handles retreat cancellations, refund eligibility, payout timing, and fund management.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Policies</span>
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A Societal Enterprise Operated under Overstory Collective
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              1. Purpose
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This document defines how Alignment Retreats handles retreat
              cancellations, refund eligibility, payout timing, and Stripe fund
              management. It ensures consistency, transparency, and compliance
              across all bookings, venues, and member hosts.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              2. Refund Philosophy
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Alignment Retreats uses an <strong className="text-foreground">escrow-based payment structure</strong> to
              protect both retreat hosts and attendees. Funds are only released
              after specific milestones (e.g., retreat completion) and refunded
              according to the following policies.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">Refunds are:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>Processed through Stripe&apos;s native refund API</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Dependent on <strong className="text-foreground">escrow status</strong> and{" "}
                  <strong className="text-foreground">fund release timing</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Governed by whether the cancellation was initiated by the{" "}
                  <strong className="text-foreground">host</strong>,{" "}
                  <strong className="text-foreground">admin</strong>, or{" "}
                  <strong className="text-foreground">attendee</strong>
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              3. Escrow Structure Overview
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Each booking payment is divided into two parts:
            </p>
            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-xl border border-border bg-muted/50">
                <p className="font-semibold text-foreground mb-1">50% Deposit</p>
                <p className="text-sm text-muted-foreground">
                  Held in escrow and eligible for refund until retreat
                  confirmation or 30 days before retreat start, whichever comes
                  first.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/50">
                <p className="font-semibold text-foreground mb-1">50% Balance</p>
                <p className="text-sm text-muted-foreground">
                  Released post-retreat completion unless an admin or
                  host-triggered cancellation occurs before payout.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If a retreat or booking is cancelled{" "}
              <strong className="text-foreground">after deposit payout</strong>, only
              unreleased funds are refundable.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
              4. Cancellation Scenarios
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  A. Admin-Initiated Cancellations
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When an admin cancels a booking, the system triggers a
                  cancellation endpoint that:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>Cancels the booking and updates escrow to &ldquo;Refunded&rdquo;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>Cancels pending scheduled payouts</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>Issues a Stripe refund for refundable funds</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  The attendee receives a full or partial refund depending on
                  whether the deposit has been released. Admin logs
                  unrecoverable funds (e.g., deposit already paid out) for
                  manual review.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  B. Host-Initiated Retreat Cancellations
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When a host cancels an entire retreat, all associated bookings
                  automatically cascade to &ldquo;Cancelled.&rdquo; The system
                  initiates refunds for all bookings:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>Held funds in escrow are refunded automatically</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>Released deposits or prior payouts are excluded</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold shrink-0">—</span>
                    <span>
                      Admin is notified for manual review of any unrecoverable
                      amounts
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  C. Attendee-Initiated Cancellations
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When an attendee cancels, refund eligibility depends on
                  retreat terms and host policy:
                </p>
                <div className="space-y-3 mb-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
                    <span className="font-medium">More than 30 days before retreat</span>
                    <span className="font-semibold">50% refund</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50 text-red-800">
                    <span className="font-medium">Within 30 days of retreat</span>
                    <span className="font-semibold">Non-refundable</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Admin can override refund eligibility manually via the
                  dashboard if special circumstances apply.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              5. Partial Refund Scenarios
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If the deposit has already been released to a host, co-host, or
              venue:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  The refundable amount equals the{" "}
                  <strong className="text-foreground">remaining escrow balance (unreleased funds)</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  The system will create a refund for the remaining balance
                  only and log unrecoverable amounts for internal accounting
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  The admin team will reconcile unrecoverable amounts manually
                  (e.g., future credit or Overstory Collective coverage)
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              6. Stripe Integration Workflow
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All refunds occur directly through Stripe&apos;s Refund API and
              webhook events ensure data consistency. Webhook events handled:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">charge.refunded</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">refund.created</code></span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              These update:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">booking_payments.payment_status</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">escrow_accounts.refunded_amount</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">bookings.booking_status = cancelled</code></span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              This ensures no mismatch between financial records and booking
              states.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              7. Edge Cases
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Multiple attendees per booking:</strong> Refunds
                  apply proportionally to each participant&apos;s portion.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Manual refunds:</strong> Only an admin may process
                  a manual refund through the Stripe Dashboard if automation
                  fails.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Stripe disputes:</strong> If an attendee files a
                  chargeback, Stripe&apos;s outcome overrides internal policies.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Non-member hosts:</strong> Refunds follow the same
                  process, but no co-op profit share applies.
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              8. Refund Timeline
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Stripe refunds typically process within{" "}
                  <strong className="text-foreground">5–10 business days</strong> depending
                  on the bank.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  The system updates refund status automatically in the admin
                  dashboard once the Stripe webhook confirms success.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Refund confirmation emails are automatically sent to the
                  attendee&apos;s email address.
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              9. Policy Ownership
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This policy is governed and enforced by{" "}
              <strong className="text-foreground">Alignment Retreats Co-Op</strong>,
              operated under <strong className="text-foreground">Overstory Collective</strong>. All
              refunds, disputes, or payout delays are managed by the Operations
              Team. Technical implementations are handled by the platform
              developer team.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              For questions or to request a refund exception, contact us at{" "}
              <a
                href="mailto:hello@alignmentretreats.xyz"
                className="text-primary hover:underline"
              >
                hello@alignmentretreats.xyz
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
