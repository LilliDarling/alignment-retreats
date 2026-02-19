import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { VenueMediaUpload } from '@/components/VenueMediaUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, ChevronRight, ChevronLeft, Mail, Camera, Video, MapPin } from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'retreat_center', label: 'Retreat Center' },
  { value: 'land', label: 'Private Land' },
  { value: 'venue', label: 'Event Venue' },
];

const AMENITY_OPTIONS = [
  'Kitchen', 'Pool', 'Hot Tub', 'Yoga Studio', 'Meditation Space',
  'Hiking Trails', 'Beach Access', 'Garden', 'Fire Pit', 'WiFi',
  'Parking', 'A/C', 'Heating', 'Laundry', 'Sound System'
];

const PRODUCTION_FEATURES = [
  'Private Chef Kitchen',
  'Sound Healing Space',
  'Outdoor Yoga Deck',
  'Meditation Room',
  'Fire Pit Area',
  'Natural Water Feature (pond, lake, stream)',
  'Dramatic Views (mountain, ocean, forest)',
  'Large Indoor Event Space',
  'Professional Lighting Setup',
  'Quiet/Secluded Location'
];

export interface LandownerOnboardingData {
  propertyName: string;
  propertyType: string;
  capacity: number;
  location: string;
  basePrice: number | null;
  minRate: number | null;
  maxRate: number | null;
  description: string;
  amenities: string[];
  contactName: string;
  contactEmail: string;
  instagramHandle: string;
  tiktokHandle: string;
  contentStatus: string;
  existingContentLink: string;
  contentDescription: string;
  interestedInResidency: boolean;
  residencyAvailableDates: string;
  propertyFeatures: string[];
  photos: string[];
  videos: string[];
}

interface LandownerOnboardingProps {
  onComplete: (data: LandownerOnboardingData) => void;
  onBack: () => void;
  initialData?: LandownerOnboardingData;
}

export function LandownerOnboarding({ onComplete, onBack, initialData }: LandownerOnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Property Identity
  const [propertyName, setPropertyName] = useState(initialData?.propertyName || '');
  const [propertyType, setPropertyType] = useState(initialData?.propertyType || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [instagramHandle, setInstagramHandle] = useState(initialData?.instagramHandle || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialData?.tiktokHandle || '');

  // Step 2: Property Details
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || '');
  const [minRate, setMinRate] = useState(initialData?.minRate?.toString() || '');
  const [maxRate, setMaxRate] = useState(initialData?.maxRate?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Step 3: Photos & Videos
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [videos, setVideos] = useState<string[]>(initialData?.videos || []);

  // Step 4: Amenities
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);

  // Step 5: Content Audit
  const [contentStatus, setContentStatus] = useState(initialData?.contentStatus || '');
  const [existingContentLink, setExistingContentLink] = useState(initialData?.existingContentLink || '');
  const [contentDescription, setContentDescription] = useState(initialData?.contentDescription || '');

  // Step 6: Production Residency
  const [interestedInResidency, setInterestedInResidency] = useState(initialData?.interestedInResidency || false);
  const [residencyAvailableDates, setResidencyAvailableDates] = useState(initialData?.residencyAvailableDates || '');
  const [propertyFeatures, setPropertyFeatures] = useState<string[]>(initialData?.propertyFeatures || []);

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleFeature = (feature: string) => {
    setPropertyFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleComplete = () => {
    onComplete({
      propertyName,
      propertyType,
      capacity: parseInt(capacity) || 0,
      location,
      basePrice: basePrice ? parseFloat(basePrice) : null,
      minRate: minRate ? parseFloat(minRate) : null,
      maxRate: maxRate ? parseFloat(maxRate) : null,
      description,
      photos,
      videos,
      amenities,
      contactName,
      contactEmail,
      instagramHandle: instagramHandle.replace('@', ''),
      tiktokHandle: tiktokHandle.replace('@', ''),
      contentStatus,
      existingContentLink,
      contentDescription,
      interestedInResidency,
      residencyAvailableDates,
      propertyFeatures,
    });
  };

  const canProceedStep1 = propertyName && propertyType && contactName && contactEmail;
  const canProceedStep2 = capacity;
  const canProceedStep3 = true; // Photos are optional

  // Step 1: Property Identity
  if (step === 1) {
    return (
      <OnboardingStep
        title="Property Identity"
        description="Tell us about your property and how to reach you"
        currentStep={1}
        totalSteps={totalSteps}
        icon={<Home className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label htmlFor="propertyName">Property Name *</Label>
            <Input
              id="propertyName"
              value={propertyName}
              onChange={e => setPropertyName(e.target.value)}
              placeholder="e.g., Mountain View Retreat"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Property Type *</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Primary Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Name *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Social Media Handles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagramHandle}
                  onChange={e => setInstagramHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={tiktokHandle}
                  onChange={e => setTiktokHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 2: Property Details
  if (step === 2) {
    return (
      <OnboardingStep
        title="Property Details"
        description="Share more about your space"
        currentStep={2}
        totalSteps={totalSteps}
        icon={<MapPin className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label htmlFor="capacity">Guest Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="Maximum number of guests"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, State or Region"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Nightly Rate Range</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              What's your typical pricing range per night?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minRate" className="text-sm">Minimum ($)</Label>
                <Input
                  id="minRate"
                  type="number"
                  value={minRate}
                  onChange={e => setMinRate(e.target.value)}
                  placeholder="500"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxRate" className="text-sm">Maximum ($)</Label>
                <Input
                  id="maxRate"
                  type="number"
                  value={maxRate}
                  onChange={e => setMaxRate(e.target.value)}
                  placeholder="2000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="basePrice">Base Price (per night) - Optional</Label>
            <Input
              id="basePrice"
              type="number"
              value={basePrice}
              onChange={e => setBasePrice(e.target.value)}
              placeholder="$0"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Your standard rate, if different from range
            </p>
          </div>

          <div>
            <Label htmlFor="description">Property Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the unique features and atmosphere of your property..."
              className="mt-2 min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 3: Photos & Videos
  if (step === 3) {
    return (
      <OnboardingStep
        title="Photos & Videos"
        description="Upload photos and videos of your property"
        currentStep={3}
        totalSteps={totalSteps}
        icon={<Camera className="w-8 h-8" />}
      >
        <VenueMediaUpload
          onPhotosChange={setPhotos}
          onVideosChange={setVideos}
          existingPhotos={photos}
          existingVideos={videos}
        />

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(2)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(4)} disabled={!canProceedStep3}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 4: Amenities
  if (step === 4) {
    return (
      <OnboardingStep
        title="Amenities"
        description="Select all the amenities available at your property"
        currentStep={4}
        totalSteps={totalSteps}
        icon={<Home className="w-8 h-8" />}
      >
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {AMENITY_OPTIONS.map(amenity => (
            <Badge
              key={amenity}
              variant={amenities.includes(amenity) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
              onClick={() => toggleAmenity(amenity)}
            >
              {amenity}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(3)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(5)}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 5: Content Audit
  if (step === 5) {
    return (
      <OnboardingStep
        title="Content Audit"
        description="Help us understand what content you have available"
        currentStep={5}
        totalSteps={totalSteps}
        icon={<Camera className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label>Current Asset Status</Label>
            <Select value={contentStatus} onValueChange={setContentStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your content status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="has_content">I have high-quality content ready to send</SelectItem>
                <SelectItem value="needs_content">I need a team to create content for me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contentLink">Existing File Link (Optional)</Label>
            <Input
              id="contentLink"
              value={existingContentLink}
              onChange={e => setExistingContentLink(e.target.value)}
              placeholder="Google Drive, Dropbox, or WeTransfer link"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Additional content link if you have more files to share
            </p>
          </div>

          <div>
            <Label htmlFor="contentDesc">Content Description</Label>
            <Textarea
              id="contentDesc"
              value={contentDescription}
              onChange={e => setContentDescription(e.target.value)}
              placeholder="What do you currently have? Drone footage? Interior photos? Lifestyle shots?"
              className="mt-2 min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(4)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(6)}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 6: Production Residency
  return (
    <OnboardingStep
      title="Production Residency"
      description="The 'Netflix' Split — Let us create stunning content at your property"
      currentStep={6}
      totalSteps={totalSteps}
      icon={<Video className="w-8 h-8" />}
    >
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-base font-medium">Interested in a 2-3 Day Content Residency?</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Our team visits your property to create professional content
            </p>
          </div>
          <Switch
            checked={interestedInResidency}
            onCheckedChange={setInterestedInResidency}
          />
        </div>

        {interestedInResidency && (
          <>
            <div>
              <Label htmlFor="availableDates">Available Dates</Label>
              <Input
                id="availableDates"
                value={residencyAvailableDates}
                onChange={e => setResidencyAvailableDates(e.target.value)}
                placeholder="e.g., Weekdays in February, or any time after March 15"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="mb-3 block">Property Features for Production</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select features that help our crew plan shots
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCTION_FEATURES.map(feature => (
                  <Badge
                    key={feature}
                    variant={propertyFeatures.includes(feature) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-2 text-sm transition-all hover:scale-105"
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(5)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete}>
          Complete Property Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
