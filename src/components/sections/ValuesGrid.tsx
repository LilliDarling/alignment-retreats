"use client";

import { motion } from "framer-motion";
import { Users, Eye, Globe, Shield, Sparkles, Heart } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Cooperative by Design",
    description:
      "We operate as a true cooperative — hosts, facilitators, and venues have a real stake in the platform. Revenue is shared fairly and decisions are made collectively.",
  },
  {
    icon: Eye,
    title: "Radical Transparency",
    description:
      "No hidden fees, no opaque algorithms. Our processes are open, our pricing is fair, and our community is always in the loop.",
  },
  {
    icon: Globe,
    title: "Globally Accessible",
    description:
      "Transformative experiences shouldn't be gatekept. We work to make retreats discoverable and accessible across cultures, geographies, and budgets.",
  },
  {
    icon: Shield,
    title: "Integrity First",
    description:
      "We vet hosts, verify venues, and hold every member of our community to high ethical standards — so participants can arrive with trust.",
  },
  {
    icon: Sparkles,
    title: "Genuine Transformation",
    description:
      "We believe retreats can change lives. Every feature we build is in service of deeper experiences and lasting impact — not just bookings.",
  },
  {
    icon: Heart,
    title: "Community Over Commerce",
    description:
      "Relationships are at the heart of everything we do. We build lasting connections between hosts, facilitators, venues, and seekers.",
  },
];

export default function ValuesGrid() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {values.map((value) => {
        const Icon = value.icon;
        return (
          <motion.div
            key={value.title}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            className="bg-white rounded-[16px] p-8 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">{value.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {value.description}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
