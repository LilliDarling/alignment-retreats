import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEO } from "@/components/SEO";
import {
  Key,
  Compass,
  Vote,
  TrendingUp,
  Users,
  Shield,
  Calendar,
  Coins,
  FileText,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CALENDLY_COOP_ONBOARDING_URL, MADC_FOUNDATION_URL } from "@/config/constants";

const steps = [
  {
    number: "01",
    icon: Key,
    title: "Join",
    description: "Become a founding member with a one-time buy-in. Only 94 seats available.",
    color: "from-primary/20 to-primary/5"
  },
  {
    number: "02",
    icon: Compass,
    title: "Host",
    description: "Create and host transformative retreats. Keep your earnings, we handle the platform.",
    color: "from-primary/15 to-primary/5"
  },
  {
    number: "03",
    icon: Vote,
    title: "Govern",
    description: "Vote annually on profit allocation and which Foundation projects get funded.",
    color: "from-secondary to-secondary/50"
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Earn",
    description: "Receive dividends based on your tier weight and retreat activity.",
    color: "from-primary/10 to-primary/3"
  }
];

const membershipFeatures = [
  "70% of net platform profit distributions",
  "Governance and voting on profit use and projects",
  "Long-term ownership and stewardship of the platform",
  "No upfront venue deposits for retreats",
  "Host unlimited retreats",
  "Full voting rights",
  "Member transparency reports"
];

const benefits = [
  { icon: Users, title: "Limited to 100 Members", description: "Exclusive founding membership" },
  { icon: Coins, title: "Keep Your Earnings", description: "Host retreats and earn directly" },
  { icon: Vote, title: "Democratic Governance", description: "Vote on profit distribution" },
  { icon: Shield, title: "Resell Your Seat", description: "Transfer after 12 months" },
  { icon: Coins, title: "No Venue Booking Fees", description: "Venues waive initial fees for members" },
  { icon: FileText, title: "Full Transparency", description: "Access financial reports" }
];

const Cooperative = () => {
  usePageTitle('Join the Co-Op');
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Join the Co-Op"
        description="Join the Alignment Retreats cooperative. Co-own the platform, vote on decisions, and share in the success of a community-driven retreat network."
        canonical="/cooperative"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 bg-primary/10 opacity-50" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6"
            >
              Only 94 Founding Seats Available
            </motion.span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Become a Co-Op
              <span className="block text-white/90">Co-Founder</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
              Alignment Retreats Co-Op is a societal enterprise operated under MADCF. Join as a co-founder and participate in profit sharing and governance.
            </p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-xl"
                onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Apply to Join
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* How It Works - 4 Steps */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to becoming a co-owner of Alignment Retreats
            </p>
          </motion.div>

          {/* Steps Flow Diagram */}
          <div className="relative max-w-6xl mx-auto">
            {/* Connection Line - Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-1 bg-gradient-to-r from-primary via-primary/60 via-secondary to-primary/40 rounded-full transform -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className={`relative h-full bg-gradient-to-br ${step.color} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
                    {/* Step Number Badge */}
                    <div className="absolute top-4 right-4 text-4xl font-bold text-foreground/10">
                      {step.number}
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="w-16 h-16 rounded-2xl bg-background shadow-md flex items-center justify-center mb-4">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                    
                    {/* Arrow for mobile/tablet */}
                    {index < steps.length - 1 && (
                      <div className="lg:hidden flex justify-center py-4">
                        <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90 md:rotate-0" />
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Co-Founder Membership */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Co-Founder Membership
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A one-time investment to become a co-owner of the platform
            </p>
          </motion.div>

          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-primary shadow-xl">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-foreground mb-2">
                    Co-Op Co-Founder
                  </CardTitle>
                  <div className="text-4xl md:text-5xl font-bold text-primary">
                    $2,000 CAD
                  </div>
                  <p className="text-sm text-muted-foreground">one-time buy-in</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Your Share</p>
                      <p className="text-2xl font-bold text-primary">70%</p>
                      <p className="text-xs text-muted-foreground">of net profits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">MADCF</p>
                      <p className="text-2xl font-bold text-foreground">30%</p>
                      <p className="text-xs text-muted-foreground">community initiatives</p>
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
                    30% of net platform profits support MADCF's societal and community initiatives.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why Join the Co-Op?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              More than a platform—a community of retreat leaders shaping the future together
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full border-0 bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <CardContent className="p-6 flex items-start gap-4">
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendly CTA Section */}
      <section id="apply" className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 opacity-30" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Join as a Co-Op Co-Founder
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Book a discovery call to learn more about co-founder membership and how to participate in profit sharing and governance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full shadow-xl"
                asChild
              >
                <a
                  href={CALENDLY_COOP_ONBOARDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join as a Co-Op Co-Founder
                  <Calendar className="ml-2 h-5 w-5" />
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline-light"
                className="text-lg px-8 py-6 rounded-full"
                asChild
              >
                <Link to="/">
                  Back to Home
                </Link>
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-white/60">
              Buy-ins are non-refundable. Members must host at least one retreat per year to remain active.
            </p>
            <a
              href={MADC_FOUNDATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-sm text-white/80 hover:text-white underline"
            >
              Learn more about the MADC Foundation
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Cooperative;
