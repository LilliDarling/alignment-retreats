import { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import SectionHeading from "@/components/ui/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { siteConfig } from "@/lib/data/site";
import {
  Key,
  Compass,
  Vote,
  TrendingUp,
  Users,
  Shield,
  Coins,
  FileText,
  Calendar,
  Check,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Join the Co-Op | Alignment Retreats",
  description:
    "Join the Alignment Retreats cooperative. Co-own the platform, vote on decisions, and share in the success of a community-driven retreat network.",
};

const CALENDLY_COOP_ONBOARDING_URL =
  "https://calendly.com/mathew-vetten/co-op-onboarding";

const steps = [
  {
    number: "01",
    icon: Key,
    title: "Join",
    description:
      "Become a founding member with a one-time buy-in. Only 94 seats available.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Host",
    description:
      "Create and host transformative retreats. Keep your earnings, we handle the platform.",
  },
  {
    number: "03",
    icon: Vote,
    title: "Govern",
    description:
      "Vote annually on profit allocation and which Foundation projects get funded.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Earn",
    description:
      "Receive dividends based on your tier weight and retreat activity.",
  },
];

const membershipFeatures = [
  "70% of net platform profit distributions",
  "Governance and voting on profit use and projects",
  "Long-term ownership and stewardship of the platform",
  "No upfront venue deposits for retreats",
  "Host unlimited retreats",
  "Full voting rights",
  "Member transparency reports",
];

const benefits = [
  {
    icon: Users,
    title: "Limited to 100 Members",
    description: "Exclusive founding membership",
  },
  {
    icon: Coins,
    title: "Keep Your Earnings",
    description: "Host retreats and earn directly",
  },
  {
    icon: Vote,
    title: "Democratic Governance",
    description: "Vote on profit distribution",
  },
  {
    icon: Shield,
    title: "Resell Your Seat",
    description: "Transfer after 12 months",
  },
  {
    icon: Coins,
    title: "No Venue Booking Fees",
    description: "Venues waive initial fees for members",
  },
  {
    icon: FileText,
    title: "Full Transparency",
    description: "Access financial reports",
  },
];

export default function CooperativePage() {
  return (
    <>
      <PageHero
        title="Become a Co-Op Co-Founder"
        subtitle="Alignment Retreats Co-Op is a societal enterprise operated under MADCF. Join as a co-founder and participate in profit sharing and governance."
        backgroundImage="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&h=600&fit=crop"
      >
        <div className="mt-8">
          <Button
            href="#apply"
            size="lg"
            variant="white"
          >
            Apply to Join
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        <p className="mt-4 text-sm text-white/60">
          Only 94 Founding Seats Available
        </p>
      </PageHero>

      {/* How It Works */}
      <section className="section-padding">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            subtitle="How It Works"
            title="Four Steps to Co-Ownership"
            description="Four simple steps to becoming a co-owner of Alignment Retreats"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <AnimateOnScroll key={step.title} delay={index * 0.1}>
                <Card className="relative h-full">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-foreground/10 font-display">
                    {step.number}
                  </div>
                  <CardHeader>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Co-Founder Membership */}
      <section className="section-padding bg-muted">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            subtitle="Membership"
            title="Co-Founder Membership"
            description="A one-time investment to become a co-owner of the platform"
          />

          <div className="max-w-xl mx-auto">
            <AnimateOnScroll>
              <Card className="border-2 border-primary">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Co-Op Co-Founder</CardTitle>
                  <div className="text-4xl md:text-5xl font-bold text-primary mt-2">
                    $2,000 CAD
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    one-time buy-in · priced in Canadian dollars
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-[12px]">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Your Share
                      </p>
                      <p className="text-2xl font-bold text-primary">70%</p>
                      <p className="text-xs text-muted-foreground">
                        of net profits
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">MADCF</p>
                      <p className="text-2xl font-bold text-foreground">30%</p>
                      <p className="text-xs text-muted-foreground">
                        community initiatives
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {membershipFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm text-muted-foreground text-center pt-2">
                    30% of net platform profits support MADCF&apos;s societal and
                    community initiatives.
                  </p>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="section-padding">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            subtitle="Benefits"
            title="Why Join the Co-Op?"
            description="More than a platform — a community of retreat leaders shaping the future together"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <AnimateOnScroll key={benefit.title} delay={index * 0.08}>
                <Card className="h-full border-0 bg-muted/50">
                  <CardContent className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Calendly CTA */}
      <section id="apply" className="section-padding bg-primary text-primary-foreground">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto">
              <SectionHeading
                title="Join as a Co-Op Co-Founder"
                description="Book a discovery call to learn more about co-founder membership and how to participate in profit sharing and governance."
                light
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  href={CALENDLY_COOP_ONBOARDING_URL}
                  size="lg"
                  variant="white"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule a Call
                </Button>
                <Button href="/" size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Back to Home
                </Button>
              </div>

              <p className="mt-8 text-sm text-primary-foreground/60">
                Buy-ins are non-refundable. Members must host at least one
                retreat per year to remain active.
              </p>
              <a
                href={siteConfig.parentOrg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-primary-foreground/80 hover:text-primary-foreground underline"
              >
                Learn more about the {siteConfig.parentOrg.name}
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
