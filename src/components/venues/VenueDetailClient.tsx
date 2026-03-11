"use client";

import Link from "next/link";
import { MapPin, Trees, Sparkles, Mountain, Users, Mail, Instagram, ArrowLeft, Eye } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SupportButton from "@/components/ui/SupportButton";
import VenueGallery from "@/components/venues/VenueGallery";
import { useIsAuthenticated } from "@/lib/hooks/useAuth";
import { VenueDetail } from "@/types/venue";

const typeLabels: Record<string, string> = {
  retreat_center: "Retreat Center",
  venue: "Venue",
  land: "Land",
};

function formatFeature(feature: string): string {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface VenueDetailClientProps {
  venue: VenueDetail;
  isPreview?: boolean;
}

export default function VenueDetailClient({ venue, isPreview = false }: VenueDetailClientProps) {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      {/* Preview Banner */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm font-medium py-2 px-4">
          This is a preview — your venue is not yet published.{" "}
          <Link href={`/venues/${venue.id}/edit`} className="underline hover:no-underline">
            Continue editing
          </Link>
        </div>
      )}

      {/* Hero header */}
      <section className={isPreview ? "pt-36 pb-0" : "pt-28 pb-0"}>
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fadeUp">
            {isPreview && (
              <Link
                href={`/venues/${venue.id}/edit`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to editing
              </Link>
            )}
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline">
                {typeLabels[venue.property_type] || "Venue"}
              </Badge>
              {isPreview && venue.status && (
                <Badge variant={venue.status === "pending_review" ? "warning" : "muted"}>
                  {venue.status === "pending_review" ? "Pending Review" : "Draft"}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display mb-4">
              {venue.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
              {venue.location && (
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  {venue.location}
                </div>
              )}
              {venue.capacity && (
                <div className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Up to {venue.capacity} guests
                </div>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Gallery + Content */}
      <section className="section-padding pt-4">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-12">
              {venue.photos.length > 0 && (
                <AnimateOnScroll>
                  <VenueGallery images={venue.photos} alt={venue.name} />
                </AnimateOnScroll>
              )}

              {venue.videos.length > 0 && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">Videos</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {venue.videos.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              )}

              {venue.description && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">About This Space</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {venue.description}
                  </p>
                </AnimateOnScroll>
              )}

              {venue.amenities.length > 0 && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {venue.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="text-sm">{formatFeature(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              )}

              {venue.property_features.length > 0 && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">What Makes This Venue Special</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {venue.property_features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 p-4 bg-muted rounded-[12px]"
                      >
                        <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm leading-relaxed">{formatFeature(feature)}</span>
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              )}

              {/* Contact (shown on published pages only) */}
              {!isPreview && (venue.contact_name || venue.contact_email || venue.instagram_handle || venue.tiktok_handle) && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">Get in Touch</h2>
                  <div className="space-y-3">
                    {venue.contact_name && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Contact: </span>
                        {venue.contact_name}
                      </p>
                    )}
                    {venue.contact_email && (
                      <a
                        href={`mailto:${venue.contact_email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {venue.contact_email}
                      </a>
                    )}
                    {venue.instagram_handle && (
                      <a
                        href={`https://instagram.com/${venue.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        @{venue.instagram_handle}
                      </a>
                    )}
                    {venue.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${venue.tiktok_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span className="w-4 h-4 text-xs font-bold flex items-center justify-center">TK</span>
                        @{venue.tiktok_handle}
                      </a>
                    )}
                  </div>
                </AnimateOnScroll>
              )}

              {/* Inspire section (published only) */}
              {!isPreview && (
                <AnimateOnScroll>
                  <div className="bg-primary/5 rounded-[16px] p-8 border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mountain className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display mb-2">Picture Your Retreat Here</h3>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          Imagine leading your group through a transformative experience in this setting.
                          From intimate workshops to full-scale retreats, this space is ready to support your vision.
                        </p>
                        <Button href="/contact" variant="primary" size="sm">
                          Inquire About Hosting Here
                        </Button>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {isPreview ? (
                <div className="bg-white rounded-[16px] p-8 shadow-sm border border-amber-200 sticky top-28 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display">Preview Mode</h3>
                      <p className="text-sm text-muted-foreground">This is how your listing will appear</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Review your listing before submitting for review. Make sure all details are accurate
                    and your photos showcase the space well.
                  </p>
                  <Button href={`/venues/${venue.id}/edit`} className="w-full">
                    Continue Editing
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-[16px] p-8 shadow-sm border border-border sticky top-28 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trees className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display">Host Here</h3>
                      <p className="text-sm text-muted-foreground">Bring your retreat vision to life</p>
                    </div>
                  </div>

                  {venue.capacity && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Up to <strong className="text-foreground">{venue.capacity} guests</strong></span>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Interested in hosting a retreat at {venue.name}? Get in touch to discuss
                    availability, logistics, and how this space can work for your group.
                  </p>

                  <Button href="/contact" className="w-full">
                    Inquire About This Venue
                  </Button>
                  <Button
                    href={isAuthenticated ? "/dashboard" : "/signup?role=host"}
                    variant="outline"
                    className="w-full"
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Become a Host"}
                  </Button>
                  <div className="pt-1">
                    <SupportButton variant="link" className="text-muted-foreground text-xs justify-center w-full" label="Have a question? Get support" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
