import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Heart, ChevronRight, ChevronLeft, Sparkles, DollarSign } from 'lucide-react';

const INTEREST_OPTIONS = [
  'Yoga', 'Meditation', 'Wellness', 'Fitness', 'Adventure',
  'Nature', 'Spiritual Growth', 'Detox', 'Art & Creativity',
  'Sound Healing', 'Silent Retreat', 'Community'
];

const BUDGET_RANGES = [
  { label: 'Budget-friendly', min: 500, max: 1000 },
  { label: 'Mid-range', min: 1000, max: 2500 },
  { label: 'Premium', min: 2500, max: 5000 },
  { label: 'Luxury', min: 5000, max: 10000 },
];

interface AttendeeOnboardingProps {
  onComplete: (data: { 
    interests: string[];
    budgetMin: number;
    budgetMax: number;
    groupPreference: 'solo' | 'partner' | 'group';
  }) => void;
  onBack: () => void;
}

export function AttendeeOnboarding({ onComplete, onBack }: AttendeeOnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 2;
  
  const [interests, setInterests] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [groupPreference, setGroupPreference] = useState<'solo' | 'partner' | 'group'>('solo');

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleComplete = () => {
    onComplete({ interests, budgetMin, budgetMax, groupPreference });
  };

  // Step 1: Interests
  if (step === 1) {
    return (
      <OnboardingStep
        title="What interests you?"
        description="Select the types of experiences you're looking for"
        currentStep={1}
        totalSteps={totalSteps}
        icon={<Sparkles className="w-8 h-8" />}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {INTEREST_OPTIONS.map(interest => (
            <Badge
              key={interest}
              variant={interests.includes(interest) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(2)} disabled={interests.length === 0}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  // Step 2: Budget & Preferences
  return (
    <OnboardingStep
      title="Budget & Preferences"
      description="Help us find retreats that match your budget"
      currentStep={2}
      totalSteps={totalSteps}
      icon={<DollarSign className="w-8 h-8" />}
    >
      <div className="space-y-8 max-w-md mx-auto">
        <div>
          <Label className="text-base font-medium">Budget Range (per person)</Label>
          <p className="text-sm text-muted-foreground mb-4">
            ${budgetMin} - ${budgetMax}
          </p>
          <Slider
            value={[budgetMin, budgetMax]}
            onValueChange={([min, max]) => {
              setBudgetMin(min);
              setBudgetMax(max);
            }}
            min={500}
            max={10000}
            step={100}
            className="mt-2"
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {BUDGET_RANGES.map(range => (
              <Badge
                key={range.label}
                variant={budgetMin === range.min && budgetMax === range.max ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                onClick={() => {
                  setBudgetMin(range.min);
                  setBudgetMax(range.max);
                }}
              >
                {range.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">How do you prefer to travel?</Label>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { value: 'solo' as const, label: 'Solo', icon: '🧘' },
              { value: 'partner' as const, label: 'With Partner', icon: '💑' },
              { value: 'group' as const, label: 'With Group', icon: '👥' },
            ].map(option => (
              <Badge
                key={option.value}
                variant={groupPreference === option.value ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-3 flex flex-col items-center gap-1 transition-all hover:scale-105"
                onClick={() => setGroupPreference(option.value)}
              >
                <span className="text-lg">{option.icon}</span>
                <span>{option.label}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete}>
          Find Retreats
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
