"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import Accordion from "@/components/ui/Accordion";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { faqs } from "@/lib/data/site";

export default function FAQSection() {
  return (
    <section className="section-padding bg-muted">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <AnimateOnScroll animation="fadeLeft">
            <SectionHeading
              subtitle="FAQ"
              title="Frequently Asked Questions"
              description="Everything you need to know about our platform"
              centered={false}
            />
            <p className="text-muted-foreground leading-relaxed">
              Can&apos;t find what you&apos;re looking for? Reach out to our
              team and we&apos;ll be happy to help.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeRight" delay={0.2}>
            <Accordion items={faqs} />
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
