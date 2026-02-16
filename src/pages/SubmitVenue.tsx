import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { VenueMediaUpload } from '@/components/VenueMediaUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Image,
  Sparkles,
  DollarSign,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react';

const propertyTypes = [
  { value: 'land', label: 'Land', description: 'Raw land or natural space' },
  { value: 'retreat_center', label: 'Retreat Center', description: 'Dedicated retreat facility' },
  { value: 'venue', label: 'Venue', description: 'Event space or meeting venue' },
];

const commonAmenities = [
  'WiFi', 'Kitchen', 'Dining Area', 'Private Bathrooms', 'Shared Bathrooms',
  'Hot Tub', 'Sauna', 'Pool', 'Yoga Studio', 'Meditation Space',
  'Outdoor Space', 'Garden', 'Fire Pit', 'BBQ', 'Parking',
  'Accessibility Features', 'Air Conditioning', 'Heating',
];

const propertyFeatures = [
  'Ocean View', 'Mountain View', 'Waterfront', 'Secluded', 'Pet Friendly',
  'Family Friendly', 'Eco-Friendly', 'Off-Grid', 'Solar Power',
  'Organic Garden', 'Farm Animals', 'Hiking Trails', 'Beach Access',
];

const steps = [
  { title: 'Venue Basics', icon: Home },
  { title: 'Photos & Videos', icon: Image },
  { title: 'Amenities & Features', icon: Sparkles },
  { title: 'Pricing', icon: DollarSign },
  { title: 'Contact & Social', icon: Phone },
  { title: 'Review & Submit', icon: Send },
];

export default function SubmitVenue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Basics
  const [venueName, setVenueName] = useState('');
  const [propertyType, setPropertyType] = useState('venue');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Media
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // Step 3: Amenities & Features
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Step 4: Pricing
  const [basePrice, setBasePrice] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [pricingNotes, setPricingNotes] = useState('');

  // Step 5: Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [contentStatus, setContentStatus] = useState('');
  const [existingContentLink, setExistingContentLink] = useState('');

  const progress = ((currentStep + 1) / steps.length) * 100;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basics
        return venueName.trim() && description.trim() && propertyType;
      case 1: // Photos & Videos
        return photos.length > 0;
      case 2: // Amenities
        return true; // Optional
      case 3: // Pricing
        return true; // Optional
      case 4: // Contact
        return true; // Optional
      case 5: // Review
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);

    try {
      // Create the property with pending_review status
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          owner_user_id: user.id,
          name: venueName,
          property_type: propertyType,
          location: location || null,
          capacity: capacity ? parseInt(capacity) : null,
          description,
          photos,
          videos,
          amenities: selectedAmenities,
          property_features: selectedFeatures,
          base_price: basePrice ? parseFloat(basePrice) : null,
          min_rate: minRate ? parseFloat(minRate) : null,
          max_rate: maxRate ? parseFloat(maxRate) : null,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          instagram_handle: instagramHandle || null,
          tiktok_handle: tiktokHandle || null,
          content_status: contentStatus || null,
          existing_content_link: existingContentLink || null,
          status: 'pending_review',
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Create admin notification
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'venue_submission',
          title: 'New Venue Submission',
          message: `${venueName} has been submitted for review.`,
          reference_id: property.id,
          reference_type: 'property',
        });

      if (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      toast({
        title: 'Venue submitted successfully!',
        description: "We'll review your submission and get back to you soon.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting venue:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Submit Your Venue"
        description="List your retreat venue or property with Alignment Retreats"
        canonical="/venues/submit"
        noindex
      />
      <AppHeader />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Your Venue</h1>
          <p className="text-muted-foreground">
            Share your space with retreat hosts around the world
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">{steps[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return StepIcon && <StepIcon className="h-6 w-6" />;
              })()}
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>
                  {currentStep === 0 && 'Tell us about your venue'}
                  {currentStep === 1 && 'Upload photos and videos of your space'}
                  {currentStep === 2 && 'What amenities and features do you offer?'}
                  {currentStep === 3 && 'Set your pricing'}
                  {currentStep === 4 && 'How can hosts reach you?'}
                  {currentStep === 5 && 'Review your submission'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Venue Basics */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="venueName">Venue Name *</Label>
                  <Input
                    id="venueName"
                    placeholder="Peaceful Mountain Retreat Center"
                    value={venueName}
                    onChange={e => setVenueName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Property Type *</Label>
                  <div className="grid gap-3 mt-2">
                    {propertyTypes.map(type => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          propertyType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="propertyType"
                          value={type.value}
                          checked={propertyType === type.value}
                          onChange={() => setPropertyType(type.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Santa Fe, New Mexico"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Maximum Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="20"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your venue, its atmosphere, unique features..."
                    className="min-h-[150px]"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Photos & Videos */}
            {currentStep === 1 && (
              <VenueMediaUpload
                onPhotosChange={setPhotos}
                onVideosChange={setVideos}
                existingPhotos={photos}
                existingVideos={videos}
              />
            )}

            {/* Step 3: Amenities & Features */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonAmenities.map(amenity => (
                      <Badge
                        key={amenity}
                        variant={selectedAmenities.includes(amenity) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Property Features</Label>
                  <div className="flex flex-wrap gap-2">
                    {propertyFeatures.map(feature => (
                      <Badge
                        key={feature}
                        variant={selectedFeatures.includes(feature) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFeature(feature)}
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Any other details about your property..."
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="basePrice">Base Price</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="5000"
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Starting price for your venue (optional)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minRate">Minimum Rate</Label>
                    <Input
                      id="minRate"
                      type="number"
                      placeholder="3000"
                      value={minRate}
                      onChange={e => setMinRate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxRate">Maximum Rate</Label>
                    <Input
                      id="maxRate"
                      type="number"
                      placeholder="10000"
                      value={maxRate}
                      onChange={e => setMaxRate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pricingNotes">Pricing Notes</Label>
                  <Textarea
                    id="pricingNotes"
                    placeholder="Details about your pricing structure, what's included..."
                    value={pricingNotes}
                    onChange={e => setPricingNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Contact & Social */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="Your name"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    placeholder="@yourhandle"
                    value={instagramHandle}
                    onChange={e => setInstagramHandle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                  <Input
                    id="tiktokHandle"
                    placeholder="@yourhandle"
                    value={tiktokHandle}
                    onChange={e => setTiktokHandle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="existingContentLink">Existing Content Link</Label>
                  <Input
                    id="existingContentLink"
                    placeholder="Link to your website, portfolio, etc."
                    value={existingContentLink}
                    onChange={e => setExistingContentLink(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contentStatus">Content Status</Label>
                  <Textarea
                    id="contentStatus"
                    placeholder="Tell us about existing photos/videos you have..."
                    value={contentStatus}
                    onChange={e => setContentStatus(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Ready to Submit</h4>
                      <p className="text-sm text-muted-foreground">
                        Review your information below. We'll review your submission and contact you
                        soon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Venue Name</h4>
                    <p>{venueName}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Property Type</h4>
                    <p>{propertyTypes.find(t => t.value === propertyType)?.label}</p>
                  </div>

                  {location && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                      <p>{location}</p>
                    </div>
                  )}

                  {capacity && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Capacity</h4>
                      <p>{capacity} guests</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Media</h4>
                    <p className="text-sm">
                      {photos.length} photo{photos.length !== 1 && 's'}
                      {videos.length > 0 && `, ${videos.length} video${videos.length !== 1 && 's'}`}
                    </p>
                  </div>

                  {selectedAmenities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAmenities.map(amenity => (
                          <Badge key={amenity} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFeatures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeatures.map(feature => (
                          <Badge key={feature} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !canProceed()}>
              {submitting ? 'Submitting...' : 'Submit Venue'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
