import { Camera } from "lucide-react";

export const metadata = {
  title: "Media Release & Usage Consent | Alignment Retreats",
  description:
    "Terms governing the use of photos, videos, testimonials, and other media submitted to Alignment Retreats.",
};

export default function MediaReleasePage() {
  return (
    <main className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Legal</span>
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground mb-4">
            Media Release &amp; Usage Consent
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            By submitting photos, videos, testimonials, or any other media
            (&ldquo;Content&rdquo;) to Alignment Retreats, you agree to the
            following terms.
          </p>
        </div>

        <div className="space-y-10">

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              1. Grant of Permission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You grant Alignment Retreats a worldwide, non-exclusive,
              royalty-free, perpetual license to use, reproduce, edit, publish,
              distribute, and display your submitted Content for marketing,
              promotional, and business purposes.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              2. Platforms of Use
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your Content may be used across, but is not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
              <li>TikTok</li>
              <li>Instagram</li>
              <li>Facebook</li>
              <li>Websites and landing pages</li>
              <li>Email marketing</li>
              <li>Advertisements (paid or organic)</li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              3. Editing &amp; Adaptation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Alignment Retreats may edit, crop, caption, reformat, or adapt
              your Content as needed for different platforms and marketing
              formats, while maintaining the original intent.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              4. Attribution
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may choose to credit your name or social media handle when
              using your Content, but are not obligated to do so.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              5. Ownership
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of your original Content. This agreement
              only grants Alignment Retreats the right to use it.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              6. No Compensation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You understand that you will not receive financial compensation
              for the use of your Content unless otherwise agreed upon in
              writing.
            </p>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              7. Representation &amp; Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You confirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
              <li>
                You are the original creator of the Content or have full rights
                to share it
              </li>
              <li>
                The Content does not infringe on any third-party rights
              </li>
              <li>
                Any individuals appearing in the Content have consented to
                being recorded and shared
              </li>
            </ul>
          </section>

          <div className="border-t border-border" />

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              8. Withdrawal of Consent
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You may request removal of your Content at any time by contacting
              Alignment Retreats. We will make reasonable efforts to remove
              future use, but cannot guarantee removal from materials already
              published or distributed.
            </p>
          </section>

          <div className="border-t border-border" />

          <section className="p-6 rounded-2xl bg-muted/50 border border-border">
            <p className="text-muted-foreground leading-relaxed">
              By submitting Content to Alignment Retreats, you acknowledge that
              you have read, understood, and agreed to these terms.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
