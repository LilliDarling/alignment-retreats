import Image from "next/image";
import PageHero from "@/components/layout/PageHero";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import SectionHeading from "@/components/ui/SectionHeading";
import ValuesGrid from "@/components/sections/ValuesGrid";
import CTABanner from "@/components/sections/CTABanner";
import { siteConfig } from "@/lib/data/site";

export const metadata = {
  title: "About | Alignment Retreats",
  description:
    "Learn about Alignment Retreats — a cooperative marketplace connecting retreat hosts, facilitators, venues, and seekers worldwide.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Alignment Retreats"
        subtitle="A cooperative marketplace for transformative experiences"
        backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=600&fit=crop"
      />

      {/* Mission */}
      <section className="section-padding">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeLeft">
              <div className="relative">
                <div className="rounded-[16px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop"
                    alt="Retreat community"
                    width={800}
                    height={600}
                    className="w-full"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-[16px] overflow-hidden shadow-2xl hidden md:block">
                  <Image
                    src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop"
                    alt="Yoga practice"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeRight">
              <span className="section-subtitle">Our Mission</span>
              <h2 className="mt-3 mb-6">
                Connecting People to Transformative Experiences
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Alignment Retreats is a cooperative platform connecting retreat
                hosts, facilitators, venues, and seekers. We believe that
                transformative experiences shouldn&apos;t be gatekept by
                algorithms or extraction-based marketplaces.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our platform makes it easy to discover retreats that match your
                interests, connect with aligned collaborators, and create
                experiences that genuinely transform lives.
              </p>
              <p className="text-primary font-medium">
                Whether you&apos;re seeking transformation or creating it,
                Alignment Retreats is your platform.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-muted">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            subtitle="Our Values"
            title="What Guides Us"
            description="The principles behind everything we build"
          />
          <ValuesGrid />
        </div>
      </section>

      {/* MADC Foundation */}
      <section className="section-padding">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <AnimateOnScroll>
              <span className="section-subtitle">Our Foundation</span>
              <h2 className="mt-3 mb-6">
                A Project of the {siteConfig.parentOrg.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Alignment Retreats is a project of the{" "}
                {siteConfig.parentOrg.name}, a nonprofit dedicated to meaningful
                community development. A portion of platform proceeds supports
                foundation initiatives focused on accessibility, education, and
                community building.
              </p>
              <a
                href={siteConfig.parentOrg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-medium hover:underline transition-colors"
              >
                Learn more about the {siteConfig.parentOrg.name} &rarr;
              </a>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
