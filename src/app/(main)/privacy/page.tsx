import { Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Alignment Retreats",
  description:
    "How Alignment Retreats collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Lock className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Legal</span>
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your privacy matters to us. This policy explains what information
            we collect, how we use it, and the choices you have.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              1. Who We Are
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Alignment Retreats is a cooperative platform operated by
              Overstory Collective. References to &ldquo;we,&rdquo; &ldquo;us,&rdquo;
              or &ldquo;our&rdquo; in this policy refer to Alignment Retreats
              and Overstory Collective. You can contact us at{" "}
              <a
                href="mailto:hello@alignmentretreats.xyz"
                className="text-primary hover:underline"
              >
                hello@alignmentretreats.xyz
              </a>
              .
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information in the following ways:
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              Information you provide directly
            </h3>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Account registration: name, email address, password
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Profile information: bio, profile photo, role (host,
                  co-host, venue owner, etc.)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Listings: retreat details, venue information, photos, and
                  pricing
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Communications: messages sent through the platform, support
                  requests, and contact form submissions
                </span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              Information collected automatically
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Usage data: pages visited, features used, time spent on the
                  platform
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Device information: browser type, operating system, IP
                  address
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Cookies and similar tracking technologies (see Section 6)
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Create and manage your account and authenticate your identity
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Display your listings and profile to other users
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Facilitate communication between hosts, co-hosts, venues, and
                  participants
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Process transactions and send booking confirmations
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Improve and personalize the platform experience
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Send transactional emails (account activity, booking updates)
                  and, with your consent, marketing communications
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Detect and prevent fraud, abuse, and violations of our Terms
                  of Service
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              4. Sharing Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal information. We may share
              information with:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Other platform users</strong> — your public profile
                  and listings are visible to other members as part of the
                  platform&apos;s core function
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Service providers</strong> — third-party vendors
                  who help us operate the platform (hosting, analytics, email
                  delivery, payment processing), under strict data agreements
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Legal authorities</strong> — when required by law,
                  court order, or to protect the rights and safety of our users
                  or the public
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Business transfers</strong> — in the event of a
                  merger, acquisition, or asset sale, user data may be
                  transferred as part of that transaction
                </span>
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              5. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account
              is active or as needed to provide the Service. If you delete your
              account, we will remove your personal data within a reasonable
              timeframe, except where we are required to retain it for legal or
              regulatory reasons.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              6. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use cookies and similar technologies to keep you logged in,
              remember your preferences, and understand how people use the
              platform. Cookies we use include:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Essential cookies</strong> — required for
                  authentication and core platform functionality
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  <strong className="text-foreground">Analytics cookies</strong> — help us understand
                  usage patterns and improve the platform (e.g., page views,
                  feature usage)
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can control cookies through your browser settings, though
              disabling essential cookies may affect the functionality of the
              platform.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              7. Your Rights & Choices
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the right to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Access, correct, or delete your personal information
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Object to or restrict certain processing of your data
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Request a portable copy of your data
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">—</span>
                <span>
                  Withdraw consent for marketing communications at any time
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:hello@alignmentretreats.xyz"
                className="text-primary hover:underline"
              >
                hello@alignmentretreats.xyz
              </a>
              .
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              8. Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your
              personal information, including encrypted data storage and
              transmission. However, no method of transmission over the internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Alignment Retreats platform is not intended for use by anyone
              under the age of 18. We do not knowingly collect personal
              information from minors. If we become aware that we have collected
              such information, we will take steps to delete it promptly.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. When we do,
              we will revise the &ldquo;Last updated&rdquo; date and, for
              material changes, notify users via email or a prominent notice on
              the platform. Continued use of the Service after changes become
              effective constitutes acceptance of the revised policy.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or concerns about this Privacy Policy or
              how your data is handled, please contact us at{" "}
              <a
                href="mailto:hello@alignmentretreats.xyz"
                className="text-primary hover:underline"
              >
                hello@alignmentretreats.xyz
              </a>{" "}
              or via our{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact form
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
