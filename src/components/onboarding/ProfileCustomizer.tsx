import { useState } from 'react';
import { OnboardingStep } from './OnboardingStep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, ChevronRight, ChevronLeft, Sparkles, Music } from 'lucide-react';

const THEME_COLORS = [
  { value: '#2E4600', name: 'Forest Moss' },
  { value: '#3E2723', name: 'Deep Cedar' },
  { value: '#818D60', name: 'Sage Leaf' },
  { value: '#C5A059', name: 'Gold Leaf' },
  { value: '#5D4E3C', name: 'Walnut' },
  { value: '#3D5A5A', name: 'Deep Teal' },
  { value: '#7A6B5D', name: 'Clay' },
  { value: '#4A6670', name: 'Storm' },
];

const EFFECTS_OPTIONS = [
  { value: 'none', label: 'None', description: 'Clean and simple' },
  { value: 'sparkle', label: 'Sparkle', description: 'Subtle glitter effect' },
  { value: 'gradient', label: 'Gradient Wave', description: 'Animated gradient' },
];

const LAYOUT_OPTIONS = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimal design' },
  { value: 'classic', label: 'Classic', description: 'Traditional MySpace style' },
  { value: 'bold', label: 'Bold', description: 'Eye-catching and vibrant' },
];

interface ProfileCustomizerProps {
  onComplete: (data: { themeColor: string; profileSongUrl: string; profileEffects: string; layoutStyle: string }) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function ProfileCustomizer({ onComplete, onBack, onSkip }: ProfileCustomizerProps) {
  const [step, setStep] = useState(1);
  const [themeColor, setThemeColor] = useState('#2E4600');
  const [profileSongUrl, setProfileSongUrl] = useState('');
  const [profileEffects, setProfileEffects] = useState('none');
  const [layoutStyle, setLayoutStyle] = useState('modern');

  const handleComplete = () => {
    onComplete({
      themeColor,
      profileSongUrl,
      profileEffects,
      layoutStyle,
    });
  };

  if (step === 1) {
    return (
      <OnboardingStep
        title="Make it yours ✨"
        description="Customize your profile with your personal style"
        currentStep={1}
        totalSteps={2}
        icon={<Palette className="w-8 h-8" />}
      >
        <div className="space-y-8 max-w-md mx-auto">
          <div>
            <Label className="mb-4 block text-center">Choose your theme color</Label>
            <div className="flex flex-wrap gap-3 justify-center">
              {THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setThemeColor(color.value)}
                  className={`w-12 h-12 rounded-full transition-all hover:scale-110 ${
                    themeColor === color.value ? 'ring-4 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="songUrl" className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4" />
              Profile Song URL (optional)
            </Label>
            <Input
              id="songUrl"
              type="url"
              value={profileSongUrl}
              onChange={e => setProfileSongUrl(e.target.value)}
              placeholder="Spotify or SoundCloud URL"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a song that plays when people visit your profile
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-8">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
            <Button onClick={() => setStep(2)}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </OnboardingStep>
    );
  }

  return (
    <OnboardingStep
      title="Choose your vibe"
      description="Select effects and layout for your profile"
      currentStep={2}
      totalSteps={2}
      icon={<Sparkles className="w-8 h-8" />}
    >
      <div className="space-y-8 max-w-md mx-auto">
        <div>
          <Label className="mb-4 block">Visual Effects</Label>
          <RadioGroup value={profileEffects} onValueChange={setProfileEffects} className="space-y-3">
            {EFFECTS_OPTIONS.map(effect => (
              <div
                key={effect.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  profileEffects === effect.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setProfileEffects(effect.value)}
              >
                <RadioGroupItem value={effect.value} id={effect.value} />
                <div>
                  <Label htmlFor={effect.value} className="cursor-pointer font-medium">
                    {effect.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{effect.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-4 block">Layout Style</Label>
          <RadioGroup value={layoutStyle} onValueChange={setLayoutStyle} className="space-y-3">
            {LAYOUT_OPTIONS.map(layout => (
              <div
                key={layout.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  layoutStyle === layout.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setLayoutStyle(layout.value)}
              >
                <RadioGroupItem value={layout.value} id={layout.value} />
                <div>
                  <Label htmlFor={layout.value} className="cursor-pointer font-medium">
                    {layout.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{layout.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={() => setStep(1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete}>
          Complete Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </OnboardingStep>
  );
}
