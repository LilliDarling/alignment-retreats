"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Briefcase,
  Award,
  Languages,
  Globe,
  Instagram,
  Plane,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { ROLE_LABELS } from "@/lib/data/retreats";
import type { HostProfileData } from "@/types/profile";

interface PublicProfileProps {
  profile: HostProfileData;
}

export default function PublicProfile({ profile }: PublicProfileProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allMedia = [
    ...(profile.portfolio_photos || []).map((url) => ({ type: "photo" as const, url })),
    ...(profile.portfolio_videos || []).map((url) => ({ type: "video" as const, url })),
  ];

  const hasSidebar =
    profile.location ||
    profile.years_experience != null ||
    profile.travel_willing ||
    profile.user_roles.length > 0 ||
    profile.instagram_handle ||
    profile.tiktok_handle ||
    profile.website_url ||
    (profile.languages && profile.languages.length > 0) ||
    (profile.expertise_areas && profile.expertise_areas.length > 0) ||
    (profile.certifications && profile.certifications.length > 0);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* Cover */}
      <div className="relative h-48 sm:h-64 rounded-[16px] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-muted mb-4">
        {profile.cover_photo && (
          <Image
            src={profile.cover_photo}
            alt="Cover"
            fill
            className="object-cover"
            sizes="100vw"
          />
        )}
      </div>

      {/* Header: Avatar + Name */}
      <div className="relative mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-14 sm:-mt-16 ml-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white bg-muted shadow-lg shrink-0 z-10">
            {profile.profile_photo ? (
              <Image
                src={profile.profile_photo}
                alt={profile.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="pt-2 sm:pt-16">
            <h1 className="text-2xl sm:text-3xl font-display text-foreground flex items-center gap-2">
              {profile.name}
              {profile.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  <Award className="w-3 h-3" />
                  Verified
                </span>
              )}
            </h1>

            {/* Quick meta — visible on mobile, hidden on lg when sidebar shows it */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground lg:hidden">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              {profile.years_experience != null && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {profile.years_experience}+ years
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={`grid grid-cols-1 ${hasSidebar ? "lg:grid-cols-3" : ""} gap-8`}>
        {/* Main content */}
        <div className={`space-y-6 ${hasSidebar ? "lg:col-span-2" : ""}`}>
          {/* Bio */}
          {profile.bio && (
            <section className="bg-white rounded-[16px] border border-border p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </section>
          )}

          {/* What I Offer */}
          {profile.what_i_offer && (
            <section className="bg-white rounded-[16px] border border-border p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">What I Offer</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profile.what_i_offer}</p>
            </section>
          )}

          {/* Portfolio */}
          {allMedia.length > 0 && (
            <section className="bg-white rounded-[16px] border border-border p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Portfolio
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allMedia.map((item, i) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer"
                  >
                    {item.type === "video" ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <Image
                        src={item.url}
                        alt="Portfolio"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <div className="space-y-6 lg:order-last">
            {/* Quick Info Card */}
            <div className="bg-white rounded-[16px] border border-border p-5 sm:p-6 space-y-4 lg:sticky lg:top-28">
              {/* Location */}
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Experience */}
              {profile.years_experience != null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>{profile.years_experience}+ years experience</span>
                </div>
              )}

              {/* Travel */}
              {profile.travel_willing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Plane className="w-4 h-4 shrink-0" />
                  <span>Willing to travel</span>
                </div>
              )}

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Languages className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{profile.languages.join(", ")}</span>
                </div>
              )}

              {/* Expertise */}
              {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.expertise_areas.map((area) => (
                        <span key={area} className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.certifications.map((cert) => (
                        <span key={cert} className="px-2.5 py-1 border border-border text-muted-foreground text-xs rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Divider before roles */}
              {profile.user_roles.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.user_roles.map((role) => (
                        <span
                          key={role}
                          className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full"
                        >
                          {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Divider before social */}
              {(profile.instagram_handle || profile.tiktok_handle || profile.website_url) && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Connect</p>
                    <div className="flex flex-col gap-2">
                      {profile.instagram_handle && (
                        <a
                          href={`https://instagram.com/${profile.instagram_handle.replace(/[^a-zA-Z0-9._]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Instagram className="w-4 h-4" />
                          @{profile.instagram_handle}
                        </a>
                      )}
                      {profile.tiktok_handle && (
                        <a
                          href={`https://tiktok.com/@${profile.tiktok_handle.replace(/[^a-zA-Z0-9._]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <TikTokIcon className="w-4 h-4" />
                          @{profile.tiktok_handle}
                        </a>
                      )}
                      {profile.website_url && (
                        <a
                          href={(() => { try { const u = new URL(profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          media={allMedia}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </main>
  );
}

function Lightbox({
  media,
  index,
  onClose,
  onChange,
}: {
  media: { type: "photo" | "video"; url: string }[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const item = media[index];
  const prev = () => onChange(index === 0 ? media.length - 1 : index - 1);
  const next = () => onChange(index === media.length - 1 ? 0 : index + 1);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <video
            src={item.url}
            className="w-full max-h-[85vh] object-contain rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="relative w-full h-[85vh]">
            <Image
              src={item.url}
              alt="Portfolio"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {index + 1} / {media.length}
      </div>
    </div>
  );
}
