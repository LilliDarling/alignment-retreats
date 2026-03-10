"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks } from "@/lib/data/site";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/layout/UserMenu";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";
import { NavbarProps } from "@/types/ui";


const megaMenuLabels = new Set(["Retreats", "Venues"]);

export default function Navbar({
  user,
  featuredRetreats = [],
  featuredVenues = [],
  categories = [],
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const megaTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { pause, resume } = useLenis();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      pause();
    } else {
      document.body.style.overflow = "";
      resume();
    }
  }, [mobileOpen, pause, resume]);

  const handleMegaEnter = (label: string) => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setActiveMega(label);
  };

  const handleMegaLeave = () => {
    megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 150);
  };

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled || !isHome
            ? "bg-white/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-5",
          isHome && !scrolled && "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/2tb.svg"
                alt="Alignment Retreats"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const hasMega = megaMenuLabels.has(link.label);
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => hasMega && handleMegaEnter(link.label)}
                    onMouseLeave={handleMegaLeave}
                  >
                    <Link
                      href={link.href}
                      aria-haspopup={hasMega ? "true" : undefined}
                      aria-expanded={
                        hasMega ? activeMega === link.label : undefined
                      }
                      onFocus={() => hasMega && handleMegaEnter(link.label)}
                      onKeyDown={(e) => {
                        if (!hasMega) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleMegaEnter(link.label);
                        } else if (e.key === "Escape") {
                          setActiveMega(null);
                        }
                      }}
                      className={cn(
                        "text-[14px] font-medium tracking-wide transition-colors inline-flex items-center gap-1",
                        scrolled || !isHome
                          ? "text-foreground hover:text-primary"
                          : "text-white/90 hover:text-white"
                      )}
                    >
                      {link.label}
                      {hasMega && <ChevronDown className="w-3 h-3" />}
                    </Link>
                  </div>
                );
              })}

              {/* Auth */}
              {user ? (
                <UserMenu user={user} scrolled={scrolled || !isHome} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "text-[14px] font-medium tracking-wide transition-colors",
                      scrolled
                        ? "text-foreground hover:text-primary"
                        : "text-white/90 hover:text-white"
                    )}
                  >
                    Sign In
                  </Link>
                  <Button
                    href="/signup"
                    size="sm"
                    variant={scrolled || !isHome ? "primary" : "white"}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X
                  className={cn(
                    "w-6 h-6",
                    scrolled || !isHome ? "text-foreground" : "text-white"
                  )}
                />
              ) : (
                <Menu
                  className={cn(
                    "w-6 h-6",
                    scrolled || !isHome ? "text-foreground" : "text-white"
                  )}
                />
              )}
            </button>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMega && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white border-t border-border shadow-xl"
              onMouseEnter={() => {
                if (megaTimeoutRef.current)
                  clearTimeout(megaTimeoutRef.current);
              }}
              onMouseLeave={handleMegaLeave}
            >
              <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeMega === "Retreats" && (
                  <div className="grid grid-cols-12 gap-8">
                    {/* Categories */}
                    <div className="col-span-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                        Categories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat}
                            href={`/retreats?category=${encodeURIComponent(cat)}`}
                            className="px-3 py-1.5 text-sm bg-muted hover:bg-primary hover:text-white rounded-full transition-colors text-foreground"
                            onClick={() => setActiveMega(null)}
                          >
                            {cat}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/retreats"
                        className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
                        onClick={() => setActiveMega(null)}
                      >
                        View All Retreats →
                      </Link>
                    </div>

                    {/* Featured Retreats */}
                    <div className="col-span-9">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                        Featured
                      </p>
                      <div className="grid grid-cols-2 gap-6">
                        {featuredRetreats.map((r) => (
                          <Link
                            key={r.id}
                            href={`/retreats/${r.slug}`}
                            className="group flex gap-4 items-start"
                            onClick={() => setActiveMega(null)}
                          >
                            <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                              {r.image ? (
                                <Image
                                  src={r.image}
                                  alt={r.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  sizes="96px"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {r.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {r.location} · {r.duration}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeMega === "Venues" && (
                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-9">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                        Featured Venues
                      </p>
                      <div className="grid grid-cols-2 gap-6">
                        {featuredVenues.map((v) => (
                          <Link
                            key={v.id}
                            href={`/venues/${v.id}`}
                            className="group flex gap-4 items-start"
                            onClick={() => setActiveMega(null)}
                          >
                            <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                              {v.image ? (
                                <Image
                                  src={v.image}
                                  alt={v.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  sizes="96px"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {v.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {v.location || "Location TBD"}
                                {v.capacity
                                  ? ` · Up to ${v.capacity} guests`
                                  : ""}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-3 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                          Have a venue?
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          List your property and connect with retreat hosts
                          worldwide.
                        </p>
                        <Button href="/contact" size="sm" variant="outline">
                          List Your Venue
                        </Button>
                      </div>
                      <Link
                        href="/venues"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => setActiveMega(null)}
                      >
                        View All Venues →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu — Bottom Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[24px] shadow-2xl lg:hidden max-h-[85vh] overflow-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="p-6">
                {/* Drag handle */}
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

                {/* Nav Groups */}
                <div className="space-y-1 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-2">
                    Explore
                  </p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-3 py-3 text-lg font-display text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {user ? (
                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-2">
                      Account
                    </p>
                    <Link
                      href="/account"
                      className="block px-3 py-3 text-lg font-display text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-3 text-lg font-display text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-3 mb-2">
                      Account
                    </p>
                    <Link
                      href="/login"
                      className="block px-3 py-3 text-lg font-display text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <Button
                    href={user ? "/account" : "/signup"}
                    className="w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    {user ? "My Account" : "Get Started"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
