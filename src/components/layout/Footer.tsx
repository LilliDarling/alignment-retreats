import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Linkedin, ShieldCheck, BadgeCheck, RefreshCcw } from "lucide-react";
import { siteConfig, navLinks } from "@/lib/data/site";

export default function Footer() {
  return (
    <footer className="text-white/80" style={{ backgroundColor: "hsl(94 27% 14%)" }}>
      {/* Top: Logo + Social */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/2tb.svg"
              alt="Alignment Retreats"
              width={40}
              height={40}
              className="h-10 w-10 brightness-0 invert opacity-90"
            />
          </Link>
          <p className="text-sm leading-relaxed max-w-md mb-6">
            A cooperative platform connecting retreat hosts, co-hosts,
            venues, and seekers for transformative experiences.
          </p>
          <div className="flex gap-4">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="border-b border-white/10 mb-8" />

        {/* 4-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Navigation */}
          <div>
            <h4 className="text-white font-display text-lg mb-4">Explore</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="text-white font-display text-lg mb-4">Get Involved</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/signup?role=host"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  Host a Retreat
                </Link>
              </li>
              <li>
                <Link
                  href="/signup?role=cohost"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  Become a Co-Host
                </Link>
              </li>
              <li>
                <Link
                  href="/signup?role=landowner"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link
                  href="/retreats"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  Find a Retreat
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-display text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about#faq"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/cancellation-policy"
                  className="inline-block text-sm hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-display text-lg mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-white hover:underline underline-offset-2 transition-colors"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white hover:underline underline-offset-2 transition-colors"
                >
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* TODO: Add NewsletterSignup component (Mailchimp integration) */}

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
          {[
            { icon: ShieldCheck, label: "Secure Payments" },
            { icon: BadgeCheck, label: "Verified Hosts" },
            { icon: RefreshCcw, label: "Money-Back Guarantee" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-white/40"
            >
              <badge.icon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-[0.08em]">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Alignment Retreats. Bringing
            people together for transformative experiences.
          </p>
          <p>
            A project of{" "}
            <a
              href={siteConfig.parentOrg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground hover:text-white transition-colors underline underline-offset-2"
            >
              {siteConfig.parentOrg.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
