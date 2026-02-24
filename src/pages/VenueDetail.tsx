import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { VenueImageGallery } from '@/components/VenueImageGallery';
import { VenueInquiryForm } from '@/components/VenueInquiryForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SEO } from '@/components/SEO';
import { format, parseISO, isBefore } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  Users,
  DollarSign,
  Home,
  Check,
  Instagram,
  Hash,
  ExternalLink,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: venue, isLoading, error } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch retreats at this venue, then resolve host names
  const { data: retreats } = useQuery({
    queryKey: ['venue-retreats', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retreats')
        .select('*')
        .eq('property_id', id)
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch host names via RPC
      const hostIds = [...new Set(data.map(r => r.host_user_id))];
      const { data: profiles } = await supabase.rpc('get_public_profiles', { profile_ids: hostIds });
      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p.name]));

      return data.map(r => ({ ...r, host: { name: profileMap.get(r.host_user_id) || null } }));
    },
    enabled: !!id,
  });

  // Separate upcoming and past retreats
  const now = new Date();
  const upcomingRetreats = retreats?.filter(r =>
    r.end_date && !isBefore(parseISO(r.end_date), now)
  ) || [];
  const pastRetreats = retreats?.filter(r =>
    r.end_date && isBefore(parseISO(r.end_date), now)
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Venue Not Found</h2>
            <p className="text-muted-foreground mb-4">This venue doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/venues/browse')}>Browse Venues</Button>
          </div>
        </div>
      </div>
    );
  }

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      land: 'Land',
      retreat_center: 'Retreat Center',
      venue: 'Venue',
    };
    return labels[type] || type;
  };

  const formatPriceRange = () => {
    if (venue.base_price) {
      return `From $${venue.base_price.toLocaleString()}`;
    }
    if (venue.min_rate && venue.max_rate) {
      return `$${venue.min_rate.toLocaleString()} - $${venue.max_rate.toLocaleString()}`;
    }
    if (venue.min_rate) {
      return `From $${venue.min_rate.toLocaleString()}`;
    }
    return 'Contact for pricing';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={venue.name}
        description={venue.description?.slice(0, 160) || `${venue.name} - Retreat venue`}
        canonical={`/venue/${id}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Place',
          name: venue.name,
          description: venue.description,
          address: venue.location,
          maximumAttendeeCapacity: venue.capacity,
        }}
      />
      <AppHeader />

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate('/venues/browse')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Venues
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary">
              <Home className="h-3 w-3 mr-1" />
              {getPropertyTypeLabel(venue.property_type)}
            </Badge>
            {venue.location && (
              <span className="text-muted-foreground flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {venue.location}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
        </div>

        {/* Gallery */}
        <VenueImageGallery
          photos={venue.photos || []}
          videos={(venue as any).videos || []}
          venueName={venue.name}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {venue.description && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">About This Venue</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{venue.description}</p>
              </section>
            )}

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Property Features */}
            {venue.property_features && venue.property_features.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Property Features</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.property_features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact</h2>
              <div className="space-y-3">
                {venue.contact_name && (
                  <div>
                    <span className="font-medium">Contact Name: </span>
                    <span className="text-muted-foreground">{venue.contact_name}</span>
                  </div>
                )}
                {venue.contact_email && (
                  <div>
                    <span className="font-medium">Email: </span>
                    <a
                      href={`mailto:${venue.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {venue.contact_email}
                    </a>
                  </div>
                )}
                <div className="flex gap-3">
                  {venue.instagram_handle && (
                    <a
                      href={`https://instagram.com/${venue.instagram_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Instagram className="h-4 w-4" />
                      {venue.instagram_handle}
                    </a>
                  )}
                  {venue.tiktok_handle && (
                    <a
                      href={`https://tiktok.com/@${venue.tiktok_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Hash className="h-4 w-4" />
                      {venue.tiktok_handle}
                    </a>
                  )}
                  {venue.existing_content_link && (
                    <a
                      href={venue.existing_content_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Retreats at This Venue */}
            {(upcomingRetreats.length > 0 || pastRetreats.length > 0) && (
              <>
                <Separator />
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Retreats at This Venue</h2>

                  {/* Upcoming Retreats */}
                  {upcomingRetreats.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Upcoming Retreats
                      </h3>
                      <div className="space-y-3">
                        {upcomingRetreats.map((retreat) => (
                          <Link
                            key={retreat.id}
                            to={`/retreat/${retreat.id}`}
                            className="block p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1">
                                  {retreat.title}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {retreat.start_date && retreat.end_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(parseISO(retreat.start_date), 'MMM d')} - {format(parseISO(retreat.end_date), 'MMM d, yyyy')}
                                    </span>
                                  )}
                                  {retreat.host?.name && (
                                    <span>
                                      Hosted by {retreat.host.name}
                                    </span>
                                  )}
                                </div>
                                {retreat.retreat_type && (
                                  <Badge variant="secondary" className="mt-2 text-xs">
                                    {retreat.retreat_type}
                                  </Badge>
                                )}
                              </div>
                              {retreat.price_per_person && (
                                <div className="text-right">
                                  <div className="font-semibold text-foreground">
                                    ${retreat.price_per_person}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    per person
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Retreats */}
                  {pastRetreats.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-muted-foreground">
                        Past Retreats
                      </h3>
                      <div className="space-y-2">
                        {pastRetreats.slice(0, 5).map((retreat) => (
                          <Link
                            key={retreat.id}
                            to={`/retreat/${retreat.id}`}
                            className="block p-3 rounded-lg border border-border/50 hover:border-border hover:bg-accent/30 transition-all"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground text-sm">
                                  {retreat.title}
                                </h4>
                                {retreat.start_date && retreat.end_date && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(parseISO(retreat.start_date), 'MMM d')} - {format(parseISO(retreat.end_date), 'd, yyyy')}
                                  </div>
                                )}
                              </div>
                              {retreat.retreat_type && (
                                <Badge variant="outline" className="text-xs">
                                  {retreat.retreat_type}
                                </Badge>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Pricing Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatPriceRange()}</span>
                  </div>

                  {venue.capacity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span>Up to {venue.capacity} guests</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Contact the owner for availability and booking details</p>
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Form */}
              <VenueInquiryForm propertyId={venue.id} venueName={venue.name} ownerUserId={venue.owner_user_id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
