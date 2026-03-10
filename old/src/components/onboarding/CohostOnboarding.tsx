import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, ChevronRight, ChevronLeft, CalendarIcon, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SKILL_OPTIONS = [
  'Wellness & Yoga',
  'Corporate & Team Building',
  'Mastermind & Networking',
  'Skill Development',
  'Creative & Branding',
  'Spiritual & Mindfulness'
];

const CLIMATE_OPTIONS = [
  'Tropical / Beach',
  'Mountain / Alpine',
  'Desert / Arid',
  'Coastal',
  'Forest / Woodland',
  'Mediterranean',
  'Urban',
  'Rural / Countryside'
];

interface CohostOnboardingData {
  skills: string[];
  dailyRate: number;
  minRate: number;
  maxRate: number;
  availableFrom: Date | undefined;
  availableTo: Date | undefined;
  preferredClimates: string[];
  preferredRegions: string;
}

interface CohostOnboardingProps {
  onComplete: (data: CohostOnboardingData) => void;
  onBack: () => void;
  initialData?: {
    skills?: string[];
    dailyRate?: number;
    availableFrom?: Date;
    availableTo?: Date;
    preferredClimates?: string[];
    preferredRegions?: string;
  };
}

export function CohostOnboarding({ onComplete, onBack, initialData }: CohostOnboardingProps) {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(initialData?.availableFrom);
  const [availableTo, setAvailableTo] = useState<Date | undefined>(initialData?.availableTo);
  const [dailyRate, setDailyRate] = useState([initialData?.dailyRate || 500]);
  const [preferredClimates, setPreferredClimates] = useState<string[]>(initialData?.preferredClimates || []);
  const [preferredRegions, setPreferredRegions] = useState(initialData?.preferredRegions || '');

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleClimate = (climate: string) => {
    setPreferredClimates(prev =>
      prev.includes(climate) ? prev.filter(c => c !== climate) : [...prev, climate]
    );
  };

  const handleComplete = () => {
    onComplete({
      skills,
      dailyRate: dailyRate[0],
      minRate: Math.floor(dailyRate[0] * 0.8),
      maxRate: Math.floor(dailyRate[0] * 1.5),
      availableFrom,
      availableTo,
      preferredClimates,
      preferredRegions,
    });
  };

  // Step 1: Skills
  if (step === 1) {
    return (
      <OnboardingStep
        title="What skills do you bring?"
        description="Select the skills you can contribute to retreats"
        currentStep={1}
        totalSteps={4}
        icon={<Users className="w-8 h-8" />}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {SKILL_OPTIONS.map(skill => (
            <Badge
              key={skill}
              variant={skills.includes(skill) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(2)} disabled={skills.length === 0}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 2: Availability (Date Range)
  if (step === 2) {
    return (
      <OnboardingStep
        title="When are you available?"
        description="Let hosts know your available date range for collaborations"
        currentStep={2}
        totalSteps={4}
        icon={<CalendarIcon className="w-8 h-8" />}
      >
        <div className="space-y-6 max-w-md mx-auto">
          {/* From Date */}
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
                  {availableFrom ? format(availableFrom, "PPP") : "Select start date"}
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

          {/* To Date */}
          <div className="space-y-2">
            <Label>Available Until</Label>
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
                  {availableTo ? format(availableTo, "PPP") : "Select end date"}
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

          <p className="text-sm text-muted-foreground text-center">
            You can update these dates anytime from your dashboard
          </p>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(3)} disabled={!availableFrom || !availableTo}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 3: Daily Rate
  if (step === 3) {
    return (
      <OnboardingStep
        title="Set your daily rate"
        description="What's your typical rate for a full day of co-hosting?"
        currentStep={3}
        totalSteps={4}
        icon={<DollarSign className="w-8 h-8" />}
      >
        <div className="space-y-8 max-w-md mx-auto">
          <div>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-primary">${dailyRate[0]}</span>
              <span className="text-xl text-muted-foreground">/day</span>
            </div>
            <Slider
              value={dailyRate}
              onValueChange={setDailyRate}
              min={200}
              max={2500}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>$200</span>
              <span>$2,500</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            This helps hosts understand your expectations. Final rates are negotiable.
          </p>
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
  return (
    <OnboardingStep
      title="Where do you want to work?"
      description="Select your preferred climates and regions"
      currentStep={4}
      totalSteps={4}
      icon={<MapPin className="w-8 h-8" />}
    >
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Climate Preferences */}
        <div>
          <Label className="text-base mb-3 block">Preferred Climates</Label>
          <div className="flex flex-wrap gap-2 justify-center">
            {CLIMATE_OPTIONS.map(climate => (
              <Badge
                key={climate}
                variant={preferredClimates.includes(climate) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                onClick={() => toggleClimate(climate)}
              >
                {climate}
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Regions */}
        <div className="space-y-2">
          <Label htmlFor="regions">Preferred Regions (optional)</Label>
          <Textarea
            id="regions"
            placeholder="e.g., Bali, Costa Rica, Pacific Northwest, Southern Europe..."
            value={preferredRegions}
            onChange={(e) => setPreferredRegions(e.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            List specific regions, countries, or areas you'd love to work in
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(3)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete} disabled={preferredClimates.length === 0}>
          Complete Co-Host Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
