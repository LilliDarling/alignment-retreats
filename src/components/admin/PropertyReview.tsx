import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Home, 
  MapPin, 
  Users, 
  DollarSign, 
  Mail, 
  Instagram, 
  Video,
  Camera,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface Property {
  id: string;
  name: string;
  property_type: string;
  location: string | null;
  capacity: number | null;
  base_price: number | null;
  description: string | null;
  amenities: string[] | null;
  contact_name: string | null;
  contact_email: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  content_status: string | null;
  existing_content_link: string | null;
  content_description: string | null;
  interested_in_residency: boolean | null;
  residency_available_dates: string | null;
  property_features: string[] | null;
  created_at: string | null;
  owner_user_id: string;
  owner_name?: string | null;
  owner_email?: string | null;
}

export default function PropertyReview() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Fetch all properties
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (propertiesData && propertiesData.length > 0) {
        // Get owner profiles
        const ownerIds = [...new Set(propertiesData.map(p => p.owner_user_id))];
        const { data: profiles } = await supabase.rpc('get_public_profiles', { profile_ids: ownerIds });

        // Get owner emails via admin function
        const enrichedProperties = await Promise.all(
          propertiesData.map(async (property) => {
            const ownerProfile = profiles?.find((p: any) => p.id === property.owner_user_id);
            let ownerEmail = null;
            
            try {
              const { data: email } = await supabase.rpc('get_profile_email_admin', { 
                profile_id: property.owner_user_id 
              });
              ownerEmail = email;
            } catch (e) {
              console.error('Error fetching email:', e);
            }

            return {
              ...property,
              owner_name: ownerProfile?.name || null,
              owner_email: ownerEmail,
            };
          })
        );

        setProperties(enrichedProperties);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      retreat_center: 'Retreat Center',
      land: 'Private Land',
      venue: 'Event Venue',
    };
    return labels[type] || type;
  };

  const getContentStatusLabel = (status: string | null) => {
    if (!status) return null;
    return status === 'has_content' ? 'Has Content Ready' : 'Needs Content Creation';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
          <p className="text-muted-foreground">Properties submitted by landowners will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Property Submissions</h2>
          <p className="text-sm text-muted-foreground">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} submitted</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {properties.map((property) => (
          <AccordionItem 
            key={property.id} 
            value={property.id}
            className="border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
              <div className="flex items-center gap-4 text-left flex-1">
                <div className="p-2 rounded-lg bg-accent">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{property.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getPropertyTypeLabel(property.property_type)}
                    </Badge>
                    {property.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </span>
                    )}
                    {property.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {property.capacity} guests
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  {property.created_at && format(new Date(property.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                {/* Property Identity */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Property Identity
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Owner</span>
                      <p className="font-medium">{property.owner_name || 'Unknown'}</p>
                      {property.owner_email && (
                        <a 
                          href={`mailto:${property.owner_email}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {property.owner_email}
                        </a>
                      )}
                    </div>

                    {(property.contact_name || property.contact_email) && (
                      <div>
                        <span className="text-sm text-muted-foreground">Primary Contact</span>
                        {property.contact_name && <p className="font-medium">{property.contact_name}</p>}
                        {property.contact_email && (
                          <a 
                            href={`mailto:${property.contact_email}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {property.contact_email}
                          </a>
                        )}
                      </div>
                    )}

                    {(property.instagram_handle || property.tiktok_handle) && (
                      <div>
                        <span className="text-sm text-muted-foreground">Social Media</span>
                        <div className="flex gap-3 mt-1">
                          {property.instagram_handle && (
                            <a 
                              href={`https://instagram.com/${property.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Instagram className="h-4 w-4" />
                              @{property.instagram_handle}
                            </a>
                          )}
                          {property.tiktok_handle && (
                            <a 
                              href={`https://tiktok.com/@${property.tiktok_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Video className="h-4 w-4" />
                              @{property.tiktok_handle}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Property Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Type</span>
                      <p className="font-medium">{getPropertyTypeLabel(property.property_type)}</p>
                    </div>
                    {property.capacity && (
                      <div>
                        <span className="text-sm text-muted-foreground">Capacity</span>
                        <p className="font-medium">{property.capacity} guests</p>
                      </div>
                    )}
                    {property.location && (
                      <div>
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="font-medium">{property.location}</p>
                      </div>
                    )}
                    {property.base_price && (
                      <div>
                        <span className="text-sm text-muted-foreground">Base Price</span>
                        <p className="font-medium">${property.base_price}/night</p>
                      </div>
                    )}
                  </div>

                  {property.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description</span>
                      <p className="text-sm mt-1">{property.description}</p>
                    </div>
                  )}

                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Amenities</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {property.amenities.map((amenity, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Audit */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Content Audit
                  </h4>
                  
                  <div className="space-y-3">
                    {property.content_status && (
                      <div>
                        <span className="text-sm text-muted-foreground">Content Status</span>
                        <Badge 
                          variant={property.content_status === 'has_content' ? 'default' : 'outline'}
                          className="ml-2"
                        >
                          {getContentStatusLabel(property.content_status)}
                        </Badge>
                      </div>
                    )}

                    {property.existing_content_link && (
                      <div>
                        <span className="text-sm text-muted-foreground">Content Link</span>
                        <a 
                          href={property.existing_content_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Files
                        </a>
                      </div>
                    )}

                    {property.content_description && (
                      <div>
                        <span className="text-sm text-muted-foreground">Content Description</span>
                        <p className="text-sm mt-1">{property.content_description}</p>
                      </div>
                    )}

                    {!property.content_status && !property.existing_content_link && !property.content_description && (
                      <p className="text-sm text-muted-foreground italic">No content information provided</p>
                    )}
                  </div>
                </div>

                {/* Production Residency */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Production Residency
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Interested:</span>
                      {property.interested_in_residency ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>

                    {property.interested_in_residency && (
                      <>
                        {property.residency_available_dates && (
                          <div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Available Dates
                            </span>
                            <p className="text-sm mt-1">{property.residency_available_dates}</p>
                          </div>
                        )}

                        {property.property_features && property.property_features.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Production Features</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {property.property_features.map((feature, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!property.interested_in_residency && (
                      <p className="text-sm text-muted-foreground italic">Not interested in production residency</p>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
