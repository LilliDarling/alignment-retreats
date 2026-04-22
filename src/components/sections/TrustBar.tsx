"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Users, Heart } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Verified Hosts",
    description: "Every host is vetted and community-approved",
  },
  {
    icon: Users,
    title: "Co-op Owned",
    description: "Revenue shared fairly across all partners",
  },
  {
    icon: Heart,
    title: "Purpose-Driven",
    description: "Backed by the Overstory Collective nonprofit",
  },
];

export default function TrustBar() {
  return (
    <section className="py-8 bg-white border-b border-border">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
          }}
          className="hidden sm:grid sm:grid-cols-3 gap-6"
        >
          {trustItems.map((item) => (
            <motion.div
              key={item.title}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile: center the group while keeping items left-aligned */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: {},
          }}
          className="flex flex-col items-center gap-4 sm:hidden"
        >
          <div className="flex flex-col gap-4 w-fit">
            {trustItems.map((item) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
