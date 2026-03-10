"use client";

import { MapPin, Trees, Sparkles, Mountain } from "lucide-react";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
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

export default function VenueDetailClient({ venue }: { venue: VenueDetail }) {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      {/* Hero header */}
      <section className="pt-28 pb-0">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fadeUp">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline">
                {typeLabels[venue.property_type] || "Venue"}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display mb-4">
              {venue.name}
            </h1>
            {venue.location && (
              <div className="flex items-center gap-2 text-muted-foreground text-lg mb-8">
                <MapPin className="w-5 h-5" />
                {venue.location}
              </div>
            )}
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

              {venue.description && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">
                    About This Space
                  </h2>
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
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{formatFeature(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              )}

              {venue.property_features.length > 0 && (
                <AnimateOnScroll>
                  <h2 className="text-2xl font-display mb-4">
                    What Makes This Venue Special
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {venue.property_features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 p-4 bg-muted rounded-[12px]"
                      >
                        <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm leading-relaxed">
                          {formatFeature(feature)}
                        </span>
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              )}

              {/* Inspire section */}
              <AnimateOnScroll>
                <div className="bg-primary/5 rounded-[16px] p-8 border border-primary/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mountain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display mb-2">
                        Picture Your Retreat Here
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Imagine leading your group through a transformative
                        experience in this setting. From intimate workshops to
                        full-scale retreats, this space is ready to support your
                        vision.
                      </p>
                      <Button
                        href="/contact"
                        variant="primary"
                        size="sm"
                      >
                        Inquire About Hosting Here
                      </Button>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[16px] p-8 shadow-sm border border-border sticky top-28 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trees className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display">Host Here</h3>
                    <p className="text-sm text-muted-foreground">
                      Bring your retreat vision to life
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Interested in hosting a retreat at {venue.name}? Get in touch
                  to discuss availability, logistics, and how this space can
                  work for your group.
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
