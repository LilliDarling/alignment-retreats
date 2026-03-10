"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { useIsAuthenticated } from "@/lib/hooks/useAuth";

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Browse curated retreats across the globe — from yoga and meditation to leadership intensives and plant medicine journeys.",
  },
  {
    number: "02",
    title: "Connect",
    description:
      "Match with the right hosts, co-hosts, and venues. Our cooperative model ensures everyone is invested in your experience.",
  },
  {
    number: "03",
    title: "Book",
    description:
      "Secure your spot with a simple inquiry. We handle the details so you can focus on preparing for your transformation.",
  },
  {
    number: "04",
    title: "Transform",
    description:
      "Step into a transformative experience with full support — before, during, and after your retreat.",
  },
];

export default function HowItWorks() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <section className="section-padding bg-muted">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="How It Works"
          title="Your Journey Starts Here"
          description="Four simple steps to your next transformative experience"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <div className="text-center bg-white rounded-[16px] p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl font-display text-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs — from deployed app */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/retreats" variant="primary">
            Browse Retreats
          </Button>
          <Button href={isAuthenticated ? "/dashboard" : "/signup"} variant="outline">
            {isAuthenticated ? "Go to Dashboard" : "Start Collaborating"}
          </Button>
        </div>
      </div>
    </section>
  );
}
