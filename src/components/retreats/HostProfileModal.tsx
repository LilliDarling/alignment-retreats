"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  X,
  ArrowRight,
  Briefcase,
  Award,
  Languages,
  Plane,
  Globe,
  Instagram,
} from "lucide-react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { ROLE_LABELS } from "@/lib/data/retreats";
import type { HostProfileData } from "@/types/profile";

interface HostProfileModalProps {
  profile: HostProfileData;
  open: boolean;
  onClose: () => void;
}

export default function HostProfileModal({
  profile,
  open,
  onClose,
}: HostProfileModalProps) {
  const { pause, resume } = useLenis();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      pause();
      document.body.style.overflow = "hidden";
      return () => {
        resume();
        document.body.style.overflow = "";
      };
    }
  }, [open, pause, resume]);

  // Lenis uses passive wheel listeners on the document, so even when stopped
  // the browser's native scroll on the modal can be swallowed.  We re-implement
  // wheel→scroll manually so the mouse wheel works inside the modal.
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = modalRef.current;
    if (!el) return;
    el.scrollTop += e.deltaY;
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 bg-white rounded-[20px] shadow-2xl overflow-y-auto w-full max-w-md max-h-[85vh]"
            style={{ overscrollBehavior: "contain" }}
            onWheel={onWheel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
                  {profile.profile_photo ? (
                    <Image
                      src={profile.profile_photo}
                      alt={profile.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-xl font-display text-foreground flex items-center gap-2">
                    {profile.name}
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        <Award className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </h3>
                  {profile.user_roles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {profile.user_roles.map((role) => (
                        <span
                          key={role}
                          className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full"
                        >
                          {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-6">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.years_experience && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {profile.years_experience}+ years
                  </span>
                )}
                {profile.travel_willing && (
                  <span className="flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5" />
                    Willing to travel
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
                    About
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* What I Offer */}
              {profile.what_i_offer && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
                    What I Offer
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {profile.what_i_offer}
                  </p>
                </div>
              )}

              {/* Expertise */}
              {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.expertise_areas.map((area) => (
                      <span
                        key={area}
                        className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Certifications
                  </h4>
                  <div className="space-y-1">
                    {profile.certifications.map((cert) => (
                      <p key={cert} className="text-sm text-muted-foreground">
                        {cert}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5" />
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2.5 py-1 border border-border text-muted-foreground text-xs rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.instagram_handle || profile.website_url) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {profile.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile.instagram_handle.replace(/[^a-zA-Z0-9._]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      @{profile.instagram_handle}
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={(() => { try { const u = new URL(profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                </div>
              )}

              {/* View Full Profile Link */}
              <Link
                href={`/profile/${profile.slug}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[30px] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                onClick={onClose}
              >
                View Full Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
