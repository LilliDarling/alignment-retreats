import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/components/contact/ContactForm";
import PageHero from "@/components/layout/PageHero";
import { siteConfig } from "@/lib/data/site";
import { Instagram, Facebook, Linkedin, Mail, MapPin } from "lucide-react";

export const metadata = {
  title: "Contact Us | Alignment Retreats",
  description: "Get in touch with the Alignment Retreats team.",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <PageHero
        title="Get in Touch"
        subtitle="Have a question or need help? We're here for you."
        backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=600&fit=crop"
      >
        {user && (
          <p className="text-sm text-white/70 mt-4">
            Already logged in? Use the{" "}
            <span className="font-medium text-white">Get Support</span>{" "}
            button in the menu for a faster response.
          </p>
        )}
      </PageHero>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 lg:gap-24 items-start">

            {/* Left: Info block */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-4">Let&apos;s Connect</h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Whether you&apos;re interested in hosting a retreat, listing your venue, becoming a facilitator, or just curious about the platform — we&apos;re here to help.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Email</p>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-base text-foreground hover:text-primary transition-colors"
                    >
                      {siteConfig.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Based In</p>
                    <p className="text-base text-foreground">Global — wherever retreats happen</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Follow Us</p>
                <div className="flex items-center gap-3">
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href={siteConfig.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href={siteConfig.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Contact form */}
            <div>
              <ContactForm />
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
