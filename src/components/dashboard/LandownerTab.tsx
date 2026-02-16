import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LandownerOnboarding, LandownerOnboardingData } from '@/components/onboarding/LandownerOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Home,
  Plus,
  MapPin,
  Users,
  DollarSign
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  base_price: number | null;
  property_type: string;
}

export default function LandownerTab() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Record<string, boolean>>({});
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyData, setEditingPropertyData] = useState<LandownerOnboardingData | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const [propertiesResult, profileResult] = await Promise.all([
        supabase
          .from('properties')
          .select('id, name, location, capacity, base_price, property_type')
          .eq('owner_user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user!.id)
          .maybeSingle()
      ]);

      const fetchedProperties = propertiesResult.data || [];
      setProperties(fetchedProperties);

      const completed = (profileResult.data?.onboarding_completed as Record<string, boolean>) || {};
      setOnboardingCompleted(completed);

      if (fetchedProperties.length === 0 && !completed?.landowner) {
        setShowOnboarding(true);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const handleEditProperty = async (propertyId: string) => {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      if (property) {
        // Convert property data to onboarding format
        const onboardingData: LandownerOnboardingData = {
          propertyName: property.name,
          propertyType: property.property_type,
          capacity: property.capacity || undefined,
          location: property.location || undefined,
          basePrice: property.base_price || 0,
          minRate: property.min_rate || null,
          maxRate: property.max_rate || null,
          description: property.description || undefined,
          photos: property.photos || [],
          videos: property.videos || [],
          amenities: property.amenities || [],
          contactName: property.contact_name || undefined,
          contactEmail: property.contact_email || undefined,
          instagramHandle: property.instagram_handle || undefined,
          tiktokHandle: property.tiktok_handle || undefined,
          contentStatus: property.content_status || undefined,
          existingContentLink: property.existing_content_link || undefined,
          contentDescription: property.content_description || undefined,
          interestedInResidency: property.interested_in_residency || false,
          residencyAvailableDates: property.residency_available_dates || undefined,
          propertyFeatures: property.property_features || [],
        };

        setEditingPropertyId(propertyId);
        setEditingPropertyData(onboardingData);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property data');
    }
  };

  const handleOnboardingComplete = async (data: LandownerOnboardingData) => {
    if (!user) return;

    setSavingProperty(true);
    try {
      // Check if we're editing or creating
      if (editingPropertyId) {
        // Update existing property
        const { data: updatedProperty, error } = await supabase
          .from('properties')
          .update({
            name: data.propertyName,
            property_type: data.propertyType as 'land' | 'retreat_center' | 'venue',
            capacity: data.capacity || null,
            location: data.location || null,
            base_price: data.basePrice,
            min_rate: data.minRate,
            max_rate: data.maxRate,
            description: data.description || null,
            photos: data.photos,
            videos: data.videos,
            amenities: data.amenities,
            contact_name: data.contactName || null,
            contact_email: data.contactEmail || null,
            instagram_handle: data.instagramHandle || null,
            tiktok_handle: data.tiktokHandle || null,
            content_status: data.contentStatus || null,
            existing_content_link: data.existingContentLink || null,
            content_description: data.contentDescription || null,
            interested_in_residency: data.interestedInResidency,
            residency_available_dates: data.residencyAvailableDates || null,
            property_features: data.propertyFeatures,
          })
          .eq('id', editingPropertyId)
          .select()
          .single();

        if (error) throw error;

        if (updatedProperty) {
          setProperties(prev => prev.map(p => p.id === editingPropertyId ? updatedProperty : p));
          toast.success('Property updated successfully!');
        }

        setEditingPropertyId(null);
        setEditingPropertyData(null);
        setShowOnboarding(false);
      } else {
        // Create new property
        const { data: newProperty, error } = await supabase
          .from('properties')
          .insert({
          owner_user_id: user.id,
          name: data.propertyName,
          property_type: data.propertyType as 'land' | 'retreat_center' | 'venue',
          capacity: data.capacity || null,
          location: data.location || null,
          base_price: data.basePrice,
          min_rate: data.minRate,
          max_rate: data.maxRate,
          description: data.description || null,
          photos: data.photos,
          videos: data.videos,
          amenities: data.amenities,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          instagram_handle: data.instagramHandle || null,
          tiktok_handle: data.tiktokHandle || null,
          content_status: data.contentStatus || null,
          existing_content_link: data.existingContentLink || null,
          content_description: data.contentDescription || null,
          interested_in_residency: data.interestedInResidency,
          residency_available_dates: data.residencyAvailableDates || null,
          property_features: data.propertyFeatures,
        })
        .select()
        .single();

      if (error) throw error;

      const updatedOnboarding = { ...onboardingCompleted, landowner: true };
      await supabase
        .from('profiles')
        .update({ onboarding_completed: updatedOnboarding })
        .eq('id', user.id);

        if (newProperty) {
          setProperties(prev => [newProperty, ...prev]);
        }
        setOnboardingCompleted(updatedOnboarding);
        setShowOnboarding(false);
        toast.success('Property created successfully!');

        // Send admin notification only for new properties
        const userEmail = await supabase.rpc('get_auth_email');
        supabase.functions.invoke('notify-profile-completed', {
        body: {
          name: data.contactName || 'Landowner',
          email: data.contactEmail || userEmail.data || '',
          roles: ['landowner'],
          completedFields: [
            `Property Name: ${data.propertyName}`,
            `Property Type: ${data.propertyType}`,
            data.location ? `Location: ${data.location}` : null,
            data.capacity ? `Capacity: ${data.capacity} guests` : null,
            data.basePrice ? `Base Price: ${data.basePrice}/night` : null,
            data.amenities.length > 0 ? `Amenities: ${data.amenities.join(', ')}` : null,
            data.propertyFeatures.length > 0 ? `Features: ${data.propertyFeatures.join(', ')}` : null,
            data.interestedInResidency ? 'Interested in Creator Residencies' : null
          ].filter(Boolean)
        }
        }).then(({ error }) => {
          if (error) console.error('Profile completion notification failed:', error);
        });
      }
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(editingPropertyId ? 'Failed to update property. Please try again.' : 'Failed to create property. Please try again.');
    } finally {
      setSavingProperty(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="max-w-4xl mx-auto">
        {savingProperty ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Saving your property...</div>
          </div>
        ) : (
          <LandownerOnboarding
            onComplete={handleOnboardingComplete}
            onBack={() => {
              setShowOnboarding(false);
              setEditingPropertyId(null);
              setEditingPropertyData(null);
            }}
            initialData={editingPropertyData || undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit Property CTA */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Submit Your Property</h2>
            <p className="text-muted-foreground">Make your venue available for retreat hosts to discover.</p>
          </div>
          <Button
            size="lg"
            className="whitespace-nowrap"
            onClick={() => setShowOnboarding(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Submit Your Property
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">My Properties</CardTitle>
          <CardDescription>Manage your venues available for retreats</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-accent/10 mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-4">Add your first property to start connecting with hosts</p>
              <Button onClick={() => setShowOnboarding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Your Property
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{property.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {property.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {property.location}
                        </span>
                      )}
                      {property.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {property.capacity} guests
                        </span>
                      )}
                      {property.base_price && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${property.base_price}/night
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProperty(property.id)}
                  >
                    Edit Property
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
