import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { LandownerOnboarding, LandownerOnboardingData } from '@/components/onboarding/LandownerOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft,
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

interface ProfileOnboarding {
  onboarding_completed: Record<string, boolean> | null;
}

export default function LandownerDashboard() {
  const { user, userRoles, hasRole } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [profileData, setProfileData] = useState<ProfileOnboarding | null>(null);
  const hasMultipleRoles = userRoles.length > 1;

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Fetch properties and profile in parallel
      const [propertiesResult, profileResult] = await Promise.all([
        supabase
          .from('properties')
          .select('id, name, location, capacity, base_price, property_type')
          .eq('owner_user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()
      ]);
      
      const fetchedProperties = propertiesResult.data || [];
      setProperties(fetchedProperties);
      
      const onboardingCompleted = (profileResult.data?.onboarding_completed as Record<string, boolean>) || {};
      setProfileData({ onboarding_completed: onboardingCompleted });
      
      // Show onboarding if no properties and not completed before
      if (fetchedProperties.length === 0 && !onboardingCompleted?.landowner) {
        setShowOnboarding(true);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [user]);

  const handleOnboardingComplete = async (data: LandownerOnboardingData) => {
    if (!user) return;
    
    setSavingProperty(true);
    try {
      // Insert the property with all new fields
      const { data: newProperty, error } = await supabase
        .from('properties')
        .insert({
          owner_user_id: user.id,
          name: data.propertyName,
          property_type: data.propertyType as 'land' | 'retreat_center' | 'venue',
          capacity: data.capacity || null,
          location: data.location || null,
          base_price: data.basePrice,
          description: data.description || null,
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

      // Mark landowner onboarding as completed
      const currentOnboarding = profileData?.onboarding_completed || {};
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: { ...currentOnboarding, landowner: true }
        })
        .eq('id', user.id);

      // Update local state
      if (newProperty) {
        setProperties([newProperty]);
      }
      setShowOnboarding(false);
      toast.success('Property created successfully!');

      // Send admin notification about profile completion
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
            data.basePrice ? `Base Price: $${data.basePrice}/night` : null,
            data.amenities.length > 0 ? `Amenities: ${data.amenities.join(', ')}` : null,
            data.propertyFeatures.length > 0 ? `Features: ${data.propertyFeatures.join(', ')}` : null,
            data.interestedInResidency ? 'Interested in Creator Residencies' : null
          ].filter(Boolean)
        }
      }).then(({ error }) => {
        if (error) console.error('Profile completion notification failed:', error);
        else console.log('Profile completion notification sent');
      });
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property. Please try again.');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleOnboardingBack = () => {
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show onboarding wizard
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {savingProperty ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-muted-foreground">Saving your property...</div>
            </div>
          ) : (
            <LandownerOnboarding 
              onComplete={handleOnboardingComplete}
              onBack={handleOnboardingBack}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {hasMultipleRoles && (
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Landowner Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage your properties and connect with retreat hosts.
          </p>
        </div>

        {/* Submit Property CTA */}
        <Card className="mb-8">
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
                <div className="inline-flex p-4 rounded-full bg-accent mb-4">
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
                    <Button variant="outline" size="sm">
                      Edit Property
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
