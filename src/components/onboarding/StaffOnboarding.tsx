import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ChevronRight, ChevronLeft } from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'chef', label: 'Chef / Cook' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'yoga_instructor', label: 'Yoga Instructor' },
  { value: 'sound_healer', label: 'Sound Healer' },
  { value: 'massage_therapist', label: 'Massage Therapist' },
  { value: 'facilitator', label: 'Facilitator' },
  { value: 'driver', label: 'Driver / Transport' },
  { value: 'cleaner', label: 'Cleaning / Housekeeping' },
  { value: 'other', label: 'Other' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends Only' },
  { value: 'flexible', label: 'Flexible' },
];

interface StaffOnboardingProps {
  onComplete: (data: { serviceType: string; experienceYears: number; dayRate: number; availability: string; portfolioUrl: string }) => void;
  onBack: () => void;
}

export function StaffOnboarding({ onComplete, onBack }: StaffOnboardingProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('');
  const [experienceYears, setExperienceYears] = useState([3]);
  const [dayRate, setDayRate] = useState([150]);
  const [availability, setAvailability] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const handleComplete = () => {
    onComplete({
      serviceType,
      experienceYears: experienceYears[0],
      dayRate: dayRate[0],
      availability,
      portfolioUrl,
    });
  };

  if (step === 1) {
    return (
      <OnboardingStep
        title="What service do you provide?"
        description="Select your primary service type"
        currentStep={1}
        totalSteps={3}
        icon={<Briefcase className="w-8 h-8" />}
      >
        <div className="max-w-xs mx-auto">
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setStep(2)} disabled={!serviceType}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </OnboardingStep>
    );
  }

  if (step === 2) {
    return (
      <OnboardingStep
        title="Experience & Rate"
        description="Tell us about your experience and day rate"
        currentStep={2}
        totalSteps={3}
        icon={<Briefcase className="w-8 h-8" />}
      >
        <div className="space-y-8 max-w-md mx-auto">
          <div>
            <Label className="mb-4 block">Years of Experience</Label>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-primary">{experienceYears[0]}</span>
              <span className="text-muted-foreground"> years</span>
            </div>
            <Slider
              value={experienceYears}
              onValueChange={setExperienceYears}
              min={0}
              max={30}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <Label className="mb-4 block">Day Rate</Label>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-primary">${dayRate[0]}</span>
              <span className="text-muted-foreground">/day</span>
            </div>
            <Slider
              value={dayRate}
              onValueChange={setDayRate}
              min={50}
              max={1000}
              step={25}
              className="w-full"
            />
          </div>
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

  return (
    <OnboardingStep
      title="Availability & Portfolio"
      description="Let hosts know when you're available and share your work"
      currentStep={3}
      totalSteps={3}
      icon={<Briefcase className="w-8 h-8" />}
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <Label>Availability</Label>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
          <Input
            id="portfolio"
            type="url"
            value={portfolioUrl}
            onChange={e => setPortfolioUrl(e.target.value)}
            placeholder="https://your-portfolio.com"
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(2)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete} disabled={!availability}>
          Complete Staff Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
