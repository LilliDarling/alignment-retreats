"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Check,
  Handshake,
} from "lucide-react";
import BookingSidebar from "@/components/retreats/BookingSidebar";
import RetreatCard from "@/components/retreats/RetreatCard";
import ItineraryTimeline from "@/components/retreats/ItineraryTimeline";
import HostProfileModal from "@/components/retreats/HostProfileModal";
import VenueSidebar from "@/components/retreats/VenueSidebar";
import MobileBookingBar from "@/components/retreats/MobileBookingBar";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { formatDateRange } from "@/lib/utils/format";
import { parseItineraryText } from "@/lib/utils/itinerary";
import { categoryHeroColors, getIncludedIcon } from "@/lib/data/retreats";
import type { Retreat } from "@/lib/types";
import type { HostProfileData } from "@/types/profile";

interface RetreatDetailClientProps {
  retreat: Retreat;
  relatedRetreats: Retreat[];
  hostProfile?: HostProfileData | null;
  teamProfiles?: HostProfileData[];
  isAuthenticated?: boolean;
  isPreview?: boolean;
}

export default function RetreatDetailClient({
  retreat,
  relatedRetreats,
  hostProfile,
  teamProfiles = [],
  isAuthenticated,
  isPreview,
}: RetreatDetailClientProps) {
  const [showHostModal, setShowHostModal] = useState(false);
  const [selectedTeamProfile, setSelectedTeamProfile] = useState<HostProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "schedule" | "included">("overview");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasGallery = (retreat.galleryImages && retreat.galleryImages.length > 0) || (retreat.galleryVideos && retreat.galleryVideos.length > 0);
  const heroColor =
    categoryHeroColors[retreat.category] || "#1A3D25";

  return (
    <>
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm font-medium text-amber-800">
            This is a preview — this retreat is not yet published and only visible to you.
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="relative h-[420px] sm:h-[480px] lg:h-[540px] overflow-hidden">
        {retreat.image ? (
          <Image
            src={retreat.image}
            alt={retreat.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${heroColor} 0%, ${heroColor}DD 25%, ${heroColor}88 50%, ${heroColor}33 75%, transparent 100%)`,
          }}
        />

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                {retreat.category}
              </span>
              {retreat.spotsLeft && retreat.spotsLeft <= 10 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {retreat.spotsLeft} spots left
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-3 max-w-3xl font-display">
              {retreat.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {retreat.location}
              </span>
              {retreat.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {retreat.duration}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateRange(retreat.startDate, retreat.endDate)}
              </span>
              {retreat.spotsTotal && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {retreat.spotsTotal} max attendees
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content + Venue Sidebar */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* LEFT COLUMN — 60% */}
            <div className="lg:col-span-3">
              {/* Host Card */}
              {hostProfile?.name && (
                <div className="p-5 bg-white rounded-[16px] border border-border mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
                      {hostProfile.profile_photo ? (
                        <Image
                          src={hostProfile.profile_photo}
                          alt={hostProfile.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                          {hostProfile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Hosted by
                      </p>
                      <p className="text-lg font-display text-foreground leading-tight">
                        {hostProfile.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHostModal(true)}
                      className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                  {hostProfile.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-2">
                      {hostProfile.bio}
                    </p>
                  )}
                </div>
              )}

              {/* Meet the Team */}
              {retreat.teamMembers && retreat.teamMembers.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Handshake className="w-4 h-4" />
                    Meet the Team
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {retreat.teamMembers.map((tm, i) => {
                      const profile = teamProfiles.find((p) => p.id === tm.userId);
                      return (
                        <button
                          key={i}
                          onClick={() => profile && setSelectedTeamProfile(profile)}
                          className={`flex items-center gap-3 p-4 bg-white rounded-[16px] border border-border text-left w-full ${profile ? "hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer" : ""}`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border">
                            {tm.profilePhoto ? (
                              <Image
                                src={tm.profilePhoto}
                                alt={tm.name || tm.role}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                {(tm.name || tm.role).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {tm.name || "Team Member"}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {tm.role.replace(/_/g, " ")}
                              {tm.description && ` — ${tm.description}`}
                            </p>
                          </div>
                          {profile && (
                            <span className="shrink-0 text-xs text-primary font-semibold">
                              View
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab bar */}
              <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
                {(
                  [
                    { key: "overview", label: "Overview" },
                    ...(hasGallery
                      ? [{ key: "gallery" as const, label: "Gallery" }]
                      : []),
                    ...(retreat.sampleItinerary
                      ? [{ key: "schedule" as const, label: "Schedule" }]
                      : []),
                    ...(retreat.amenities && retreat.amenities.length > 0
                      ? [{ key: "included" as const, label: "What's Included" }]
                      : []),
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`relative px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-12">
                      <AnimateOnScroll>
                        <h2 className="text-2xl font-display mb-4">About This Retreat</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-6">
                          {retreat.longDescription || retreat.description}
                        </p>

                        {retreat.amenities && retreat.amenities.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
                            {retreat.amenities.slice(0, 6).map((item, i) => (
                              <div key={i} className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm text-muted-foreground">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </AnimateOnScroll>
                    </div>
                  )}

                  {activeTab === "gallery" && hasGallery && (
                    <AnimateOnScroll>
                      <h2 className="text-2xl font-display mb-6">Gallery</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {retreat.galleryImages?.map((url, i) => (
                          <button
                            key={`img-${i}`}
                            onClick={() => setLightboxIndex(i)}
                            className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
                          >
                            <Image
                              src={url}
                              alt={`${retreat.title} photo ${i + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 50vw, 300px"
                            />
                          </button>
                        ))}
                        {retreat.galleryVideos?.map((url, i) => (
                          <div
                            key={`vid-${i}`}
                            className="relative aspect-video rounded-xl overflow-hidden bg-black"
                          >
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              controls
                              playsInline
                              preload="metadata"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Lightbox */}
                      <AnimatePresence>
                        {lightboxIndex !== null && retreat.galleryImages && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                            onClick={() => setLightboxIndex(null)}
                          >
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.9 }}
                              className="relative max-w-4xl max-h-[85vh] w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Image
                                src={retreat.galleryImages[lightboxIndex]}
                                alt={`${retreat.title} photo ${lightboxIndex + 1}`}
                                width={1200}
                                height={800}
                                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                              />
                              <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                  onClick={() => setLightboxIndex(null)}
                                  className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer text-xl"
                                >
                                  ×
                                </button>
                              </div>
                              {retreat.galleryImages.length > 1 && (
                                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
                                  <button
                                    onClick={() => setLightboxIndex((lightboxIndex - 1 + retreat.galleryImages!.length) % retreat.galleryImages!.length)}
                                    className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto cursor-pointer text-xl"
                                  >
                                    ‹
                                  </button>
                                  <button
                                    onClick={() => setLightboxIndex((lightboxIndex + 1) % retreat.galleryImages!.length)}
                                    className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto cursor-pointer text-xl"
                                  >
                                    ›
                                  </button>
                                </div>
                              )}
                              <p className="text-center text-white/60 text-sm mt-3">
                                {lightboxIndex + 1} / {retreat.galleryImages.length}
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </AnimateOnScroll>
                  )}

                  {activeTab === "schedule" && retreat.sampleItinerary && (
                    <AnimateOnScroll>
                      <h2 className="text-2xl font-display mb-6">Daily Schedule</h2>
                      <ItineraryTimeline days={parseItineraryText(retreat.sampleItinerary)} />
                    </AnimateOnScroll>
                  )}

                  {activeTab === "included" && retreat.amenities && (
                    <AnimateOnScroll>
                      <h2 className="text-2xl font-display mb-6">What&apos;s Included</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {retreat.amenities.map((item, i) => {
                          const Icon = getIncludedIcon(item);
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-4 bg-white rounded-[16px] border border-border"
                            >
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Icon className="w-[18px] h-[18px] text-primary" />
                              </div>
                              <span className="text-muted-foreground text-sm pt-1.5">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </AnimateOnScroll>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Booking — below content */}
              <div id="booking-sidebar" className="mt-16">
                <AnimateOnScroll>
                  <BookingSidebar retreat={retreat} isAuthenticated={isAuthenticated} />
                </AnimateOnScroll>
              </div>
            </div>

            {/* RIGHT COLUMN — 40% Venue Sidebar */}
            {retreat.property && (
              <div className="hidden lg:block lg:col-span-2">
                <VenueSidebar property={retreat.property} />
              </div>
            )}

            {/* Mobile Venue — below content on small screens */}
            {retreat.property && (
              <div className="lg:hidden">
                <VenueSidebar property={retreat.property} />
              </div>
            )}
          </div>

          {/* Related Retreats */}
          {relatedRetreats.length > 0 && (
            <div className="mt-20">
              <AnimateOnScroll>
                <h2 className="text-2xl font-display mb-8">You Might Also Like</h2>
              </AnimateOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedRetreats.map((r) => (
                  <RetreatCard key={r.id} retreat={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Host Profile Modal */}
      {hostProfile && (
        <HostProfileModal
          profile={hostProfile}
          open={showHostModal}
          onClose={() => setShowHostModal(false)}
        />
      )}

      {/* Team Member Profile Modal */}
      {selectedTeamProfile && (
        <HostProfileModal
          profile={selectedTeamProfile}
          open={!!selectedTeamProfile}
          onClose={() => setSelectedTeamProfile(null)}
        />
      )}

      {/* Mobile Bottom Bar */}
      <MobileBookingBar retreat={retreat} />
    </>
  );
}
