import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Safety Guidelines | Alignment Retreats",
  description:
    "Our commitment to safe, ethical, and transformative retreat experiences for hosts, facilitators, venues, and participants.",
};

export default function SafetyPage() {
  return (
    <main className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Safety & Trust</span>
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground mb-4">
            Safety Guidelines
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Alignment Retreats is built on trust. These guidelines exist to
            protect every member of our community — participants, hosts,
            co-hosts, and venue partners alike.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: March 2026
          </p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-10">

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              1. Host & Facilitator Standards
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All hosts and facilitators on Alignment Retreats go through a
              review process before their listings are made public. We assess:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Professional background, credentials, and relevant
                  certifications where applicable
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Community references and prior facilitation experience
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Alignment with our cooperative values and code of conduct
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Clear communication of what participants can expect
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Approved status can be revoked at any time if a host or
              facilitator violates these standards or receives substantiated
              complaints from participants.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              2. Participant Safety
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Every participant has the right to feel safe, respected, and
              informed. Before booking any retreat, participants should:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Read all retreat details carefully, including activities,
                  accommodations, and any health or physical requirements
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Disclose any relevant health conditions, medications, or
                  dietary needs to the host prior to arrival
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Understand the cancellation and refund terms before
                  completing a booking
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Contact our team if anything feels unclear or concerning
                  before or after a retreat
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              3. Venue Standards
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Venues listed on Alignment Retreats are reviewed to ensure they
              meet a baseline of safety and suitability. Venue partners agree
              to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Accurately represent the property, including amenities,
                  capacity, and any limitations
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Maintain the property in a safe and clean condition
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Comply with all local regulations and zoning requirements for
                  hosting events or retreats
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Provide emergency contact information and basic safety
                  resources on-site
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              4. Community Code of Conduct
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All members of the Alignment Retreats community are expected to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Treat every person with dignity, respect, and care
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Refrain from harassment, discrimination, or abuse of any kind
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Honor boundaries — both physical and emotional — of all
                  participants and facilitators
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Act honestly and transparently in all communications on the
                  platform
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Violations of the community code of conduct may result in account
              suspension or permanent removal from the platform.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              5. Reporting a Concern
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you witness or experience anything that makes you feel unsafe
              or that violates our guidelines, please reach out to us
              immediately. We take every report seriously and respond promptly.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You can report a concern by emailing{" "}
              <a
                href="mailto:hello@alignmentretreats.xyz"
                className="text-primary hover:underline"
              >
                hello@alignmentretreats.xyz
              </a>{" "}
              or using the{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact form
              </a>
              . All reports are treated confidentially.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              6. Health & Wellness Considerations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Some retreats involve physical activities, breathwork,
              plant-based medicines, or other practices that may not be
              suitable for everyone. Hosts are required to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Clearly disclose all activities and practices in their
                  retreat listing
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Screen participants for contraindications where necessary
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Have an emergency protocol in place and, where appropriate,
                  a qualified medical professional available
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Participants are encouraged to consult their healthcare provider
              before attending any retreat involving intensive physical or
              therapeutic practices.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
