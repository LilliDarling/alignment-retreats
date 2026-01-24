import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Crown, ChevronRight, ChevronLeft, CalendarIcon, Link, Image } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EXPERTISE_OPTIONS = [
  'Wellness & Yoga',
  'Corporate & Team Building',
  'Mastermind & Networking',
  'Skill Development',
  'Creative & Branding',
  'Spiritual & Mindfulness'
];

const CLIMATE_OPTIONS = [
  'Tropical',
  'Desert',
  'Mediterranean',
  'Mountain',
  'Coastal',
  'Forest'
];

interface HostOnboardingProps {
  onComplete: (data: { 
    expertiseAreas: string[]; 
    minRate: number; 
    maxRate: number;
    availableFrom: Date | undefined;
    availableTo: Date | undefined;
    portfolioLinks: string;
    hasMarketingMaterial: boolean;
    marketingDescription: string;
    preferredClimates: string[];
    preferredRegions: string;
  }) => void;
  onBack: () => void;
  initialData?: { 
    expertiseAreas?: string[]; 
    minRate?: number; 
    maxRate?: number;
    availableFrom?: Date;
    availableTo?: Date;
    portfolioLinks?: string;
    hasMarketingMaterial?: boolean;
    marketingDescription?: string;
    preferredClimates?: string[];
    preferredRegions?: string;
  };
}

export function HostOnboarding({ onComplete, onBack, initialData }: HostOnboardingProps) {
  const [step, setStep] = useState(1);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(initialData?.expertiseAreas || []);
  const [rateRange, setRateRange] = useState([initialData?.minRate || 500, initialData?.maxRate || 2000]);
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(initialData?.availableFrom);
  const [availableTo, setAvailableTo] = useState<Date | undefined>(initialData?.availableTo);
  const [portfolioLinks, setPortfolioLinks] = useState(initialData?.portfolioLinks || '');
  const [hasMarketingMaterial, setHasMarketingMaterial] = useState(initialData?.hasMarketingMaterial || false);
  const [marketingDescription, setMarketingDescription] = useState(initialData?.marketingDescription || '');
  const [preferredClimates, setPreferredClimates] = useState<string[]>(initialData?.preferredClimates || []);
  const [preferredRegions, setPreferredRegions] = useState(initialData?.preferredRegions || '');

  const toggleExpertise = (area: string) => {
    setExpertiseAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleClimate = (climate: string) => {
    setPreferredClimates(prev =>
      prev.includes(climate) ? prev.filter(c => c !== climate) : [...prev, climate]
    );
  };

  const handleComplete = () => {
    onComplete({
      expertiseAreas,
      minRate: rateRange[0],
      maxRate: rateRange[1],
      availableFrom,
      availableTo,
      portfolioLinks,
      hasMarketingMaterial,
      marketingDescription,
      preferredClimates,
      preferredRegions,
    });
  };

  // Step 1: Expertise Areas
  if (step === 1) {
    return (
      <OnboardingStep
        title="What's your expertise?"
        description="Select the areas you specialize in for your retreats"
        currentStep={1}
        totalSteps={5}
        icon={<Crown className="w-8 h-8" />}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {EXPERTISE_OPTIONS.map(area => (
            <Badge
              key={area}
              variant={expertiseAreas.includes(area) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
              onClick={() => toggleExpertise(area)}
            >
              {area}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(2)} disabled={expertiseAreas.length === 0}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 2: Date Preferences
  if (step === 2) {
    return (
      <OnboardingStep
        title="When are you available?"
        description="Set your preferred date range for hosting retreats"
        currentStep={2}
        totalSteps={5}
        icon={<CalendarIcon className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Available From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !availableFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {availableFrom ? format(availableFrom, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={availableFrom}
                    onSelect={setAvailableFrom}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Available To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !availableTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {availableTo ? format(availableTo, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={availableTo}
                    onSelect={setAvailableTo}
                    initialFocus
                    disabled={(date) => date < (availableFrom || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            This helps us match you with venues and collaborators
          </p>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(3)}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 3: Portfolio & Marketing
  if (step === 3) {
    return (
      <OnboardingStep
        title="Share your work"
        description="Help us understand your experience and brand"
        currentStep={3}
        totalSteps={5}
        icon={<Link className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="portfolioLinks">Links to past retreats or work</Label>
            <Textarea
              id="portfolioLinks"
              value={portfolioLinks}
              onChange={(e) => setPortfolioLinks(e.target.value)}
              placeholder="Share links to your website, social media, past retreats, testimonials, etc. (one per line)"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Instagram, website, YouTube, past retreat pages, etc.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label>Do you have marketing material ready?</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={hasMarketingMaterial ? 'default' : 'outline'}
                onClick={() => setHasMarketingMaterial(true)}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-2" />
                Yes, I have assets
              </Button>
              <Button
                type="button"
                variant={!hasMarketingMaterial ? 'default' : 'outline'}
                onClick={() => setHasMarketingMaterial(false)}
                className="flex-1"
              >
                Not yet
              </Button>
            </div>

            {hasMarketingMaterial && (
              <div className="space-y-2">
                <Label htmlFor="marketingDescription">Tell us about your marketing assets</Label>
                <Textarea
                  id="marketingDescription"
                  value={marketingDescription}
                  onChange={(e) => setMarketingDescription(e.target.value)}
                  placeholder="Describe what you have: photos, videos, testimonials, branded materials, etc."
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(2)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(4)}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 4: Location Preferences
  if (step === 4) {
    return (
      <OnboardingStep
        title="Where do you want to host?"
        description="Tell us about your ideal retreat locations"
        currentStep={4}
        totalSteps={5}
        icon={<Crown className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-3">
            <Label>Preferred Climates</Label>
            <div className="flex flex-wrap gap-2 justify-center">
              {CLIMATE_OPTIONS.map(climate => (
                <Badge
                  key={climate}
                  variant={preferredClimates.includes(climate) ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                  onClick={() => toggleClimate(climate)}
                >
                  {climate}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredRegions">Preferred Regions</Label>
            <Textarea
              id="preferredRegions"
              value={preferredRegions}
              onChange={(e) => setPreferredRegions(e.target.value)}
              placeholder="E.g., Bali, Costa Rica, Portugal, anywhere with good wifi..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              List specific countries, regions, or general preferences
            </p>
          </div>
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

  // Step 5: Rate Range
  return (
    <OnboardingStep
      title="Set your rate range"
      description="What's your typical price range per person for retreats?"
      currentStep={5}
      totalSteps={5}
      icon={<Crown className="w-8 h-8" />}
    >
      <div className="space-y-8 max-w-md mx-auto">
        <div>
          <div className="flex justify-between mb-4">
            <span className="text-2xl font-bold text-primary">${rateRange[0]}</span>
            <span className="text-muted-foreground">to</span>
            <span className="text-2xl font-bold text-primary">${rateRange[1]}</span>
          </div>
          <Slider
            value={rateRange}
            onValueChange={setRateRange}
            min={100}
            max={10000}
            step={100}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Per person, per retreat
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(4)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete}>
          Complete Host Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
