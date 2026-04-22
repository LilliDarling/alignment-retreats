import type { SiteConfig, FAQ } from "@/lib/types";

export const siteConfig: SiteConfig = {
  name: "Alignment Retreats",
  tagline: "Host, Discover, and Thrive Together",
  description:
    "Discover transformative retreat experiences for alignment, wellness, and personal growth. Browse retreats, connect with hosts, and book your next experience.",
  url: "https://alignmentretreats.xyz",
  email: "hello@alignmentretreats.xyz",
  social: {
    instagram: "https://www.instagram.com/alignment.retreats",
    facebook:
      "https://www.facebook.com/people/Alignment-Retreats-Co-op/61587878720842/",
    linkedin: "https://www.linkedin.com/company/madc-foundation/",
    youtube: "https://www.youtube.com/@AlignmentRetreats",
    tiktok: "https://www.tiktok.com/@alignment.retreats",
  },
  videoUrl:
    "https://pub-fb209cd67e9a4a668e7d182d022f613a.r2.dev/Alignment-Retreats-Website-BG.mp4",
  parentOrg: {
    name: "Overstory Collective",
    url: "https://madcfoundation.org/",
  },
};

export const navLinks = [
  { label: "Retreats", href: "/retreats" },
  { label: "Venues", href: "/venues" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const stats = [
  { label: "Retreats Hosted", value: 50, suffix: "+" },
  { label: "Co-Hosts", value: 30, suffix: "+" },
  { label: "Countries", value: 12, suffix: "" },
  { label: "Average Rating", value: 4.9, suffix: "/5" },
];

export const faqs: FAQ[] = [
  {
    question: "What is Alignment Retreats?",
    answer:
      "Alignment Retreats is a cooperative platform connecting retreat hosts, co-hosts, venues, and seekers. We make it easy to discover transformative retreat experiences or to create and host your own.",
  },
  {
    question: "How do I book a retreat?",
    answer:
      "Browse our retreat listings, find one that resonates with you, and submit an inquiry through the retreat page. The host will follow up with availability and booking details.",
  },
  {
    question: "Can I host my own retreat?",
    answer:
      "Absolutely! Alignment Retreats is built for hosts. Create a profile, list your retreat with details and pricing, and connect with co-hosts, venues, and seekers through our platform.",
  },
  {
    question: "What makes this a cooperative?",
    answer:
      "Unlike traditional marketplaces, we operate as a cooperative — meaning hosts, co-hosts, and venue partners all have a stake in the platform. Revenue is shared fairly, and decisions are made collectively.",
  },
  {
    question: "What types of retreats are available?",
    answer:
      "From yoga and meditation to leadership intensives and wellness immersions — our platform hosts a diverse range of transformative experiences across multiple countries.",
  },
  {
    question: "How does Overstory Collective connect to Alignment Retreats?",
    answer:
      "Alignment Retreats is a project of Overstory Collective, a nonprofit dedicated to meaningful community development. A portion of platform proceeds supports foundation initiatives.",
  },
];
