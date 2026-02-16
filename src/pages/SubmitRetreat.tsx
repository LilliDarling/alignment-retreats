import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Target,
  Calendar,
  Send,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';

const expertiseAreas = [
  'Yoga', 'Meditation', 'Breathwork', 'Sound Healing', 'Ayurveda',
  'Plant Medicine', 'Wellness', 'Fitness', 'Nutrition', 'Mindfulness',
  'Art & Creativity', 'Writing', 'Dance', 'Music', 'Coaching',
  'Corporate', 'Team Building', 'Networking', 'Leadership', 'Mastermind'
];

const needsOptions = [
  { id: 'venue', label: 'Venue / Location', description: 'I need a space to host my retreat' },
  { id: 'cohost', label: 'Co-Host', description: 'I want a partner to help lead the retreat' },
  { id: 'chef', label: 'Chef / Catering', description: 'I need someone to handle meals' },
  { id: 'photographer', label: 'Photographer / Videographer', description: 'Capture the experience' },
  { id: 'yoga_instructor', label: 'Yoga Instructor', description: 'Lead yoga sessions' },
  { id: 'sound_healer', label: 'Sound Healer', description: 'Facilitate sound baths' },
  { id: 'massage', label: 'Massage Therapist', description: 'Offer bodywork services' },
  { id: 'other', label: 'Other Staff', description: 'Additional support' },
];

const steps = [
  { title: 'What You Offer', icon: Sparkles },
  { title: 'What You Need', icon: Target },
  { title: 'Goals & Dates', icon: Calendar },
  { title: 'Sample Itinerary', icon: Lightbulb },
  { title: 'Review & Submit', icon: Send },
];

export default function SubmitRetreat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [whatYouOffer, setWhatYouOffer] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [needsNotes, setNeedsNotes] = useState<Record<string, string>>({});
  const [earningsPerPerson, setEarningsPerPerson] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [datesFlexible, setDatesFlexible] = useState(true);
  const [sampleItinerary, setSampleItinerary] = useState('');

  const progress = ((currentStep + 1) / steps.length) * 100;

  const toggleExpertise = (area: string) => {
    setSelectedExpertise(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleNeed = (needId: string) => {
    setSelectedNeeds(prev =>
      prev.includes(needId) ? prev.filter(n => n !== needId) : [...prev, needId]
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

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);

    try {
      // Get user profile for email notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // Create the retreat with pending_review status
      const { data: retreat, error: retreatError } = await supabase
        .from('retreats')
        .insert({
          host_user_id: user.id,
          title: title || `${selectedExpertise[0] || 'Wellness'} Retreat`,
          description: whatYouOffer,
          what_you_offer: whatYouOffer,
          what_you_want: earningsPerPerson ? `Target earnings: ${earningsPerPerson}/person` : null,
          looking_for: {
            needs: selectedNeeds,
            notes: needsNotes,
          },
          sample_itinerary: sampleItinerary,
          preferred_dates_flexible: datesFlexible,
          retreat_type: selectedExpertise[0] || 'wellness',
          price_per_person: earningsPerPerson ? parseFloat(earningsPerPerson) : null,
          status: 'pending_review',
        })
        .select()
        .single();

      if (retreatError) throw retreatError;

      // Create admin notification in database
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'retreat_submission',
          title: 'New Retreat Submission',
          message: `${title || 'A new retreat'} has been submitted for review.`,
          reference_id: retreat.id,
          reference_type: 'retreat',
        });

      if (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      // Send email notification (don't block on this)
      supabase.functions.invoke('notify-retreat-submission', {
        body: {
          title: title || `${selectedExpertise[0] || 'Wellness'} Retreat`,
          expertise: selectedExpertise,
          whatYouOffer,
          needs: selectedNeeds,
          needsNotes,
          earningsPerPerson,
          preferredDates,
          datesFlexible,
          sampleItinerary,
          submitterName: profile?.name || 'Unknown',
          submitterEmail: user.email || 'Unknown',
        },
      }).then(({ error }) => {
        if (error) console.error('Email notification failed:', error);
        else console.log('Email notification sent successfully');
      });

      toast({
        title: 'Retreat Submitted!',
        description: 'Your retreat idea has been sent to our team. We\'ll match you with the perfect collaborators.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting retreat:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-medium">Give your retreat a working title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mountain Meditation Escape"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-medium">What's your expertise?</Label>
              <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {expertiseAreas.map((area) => (
                  <Badge
                    key={area}
                    variant={selectedExpertise.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-2 px-4 hover:bg-primary/90"
                    onClick={() => toggleExpertise(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="offer" className="text-base font-medium">Tell us about your retreat concept</Label>
              <p className="text-sm text-muted-foreground mb-2">What transformation do you offer participants?</p>
              <Textarea
                id="offer"
                value={whatYouOffer}
                onChange={(e) => setWhatYouOffer(e.target.value)}
                placeholder="Describe your vision, what makes your retreat unique, and the experience you want to create..."
                className="mt-2 min-h-[150px]"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What do you need to make this happen?</Label>
              <p className="text-sm text-muted-foreground mb-4">We'll match you with the right people and places</p>

              <div className="grid gap-3">
                {needsOptions.map((need) => (
                  <div key={need.id}>
                    <div
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedNeeds.includes(need.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => toggleNeed(need.id)}
                    >
                      <Checkbox
                        checked={selectedNeeds.includes(need.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{need.label}</p>
                        <p className="text-sm text-muted-foreground">{need.description}</p>
                      </div>
                    </div>

                    {selectedNeeds.includes(need.id) && (
                      <Textarea
                        value={needsNotes[need.id] || ''}
                        onChange={(e) => setNeedsNotes({ ...needsNotes, [need.id]: e.target.value })}
                        placeholder={`Any specific requirements for ${need.label.toLowerCase()}?`}
                        className="mt-2 ml-8"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <Label htmlFor="earnings" className="text-base font-medium">How much do you need to earn per person?</Label>
              <p className="text-sm text-muted-foreground mb-4">
                We'll calculate the final ticket price based on venue, team, and other costs. Just tell us what you need to take home.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="earnings"
                  type="number"
                  value={earningsPerPerson}
                  onChange={(e) => setEarningsPerPerson(e.target.value)}
                  placeholder="500"
                  className="pl-7"
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dates" className="text-base font-medium">Preferred dates</Label>
              <Input
                id="dates"
                value={preferredDates}
                onChange={(e) => setPreferredDates(e.target.value)}
                placeholder="e.g., Spring 2026, or March 15-20, 2026"
                className="mt-2"
              />
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="flexible"
                  checked={datesFlexible}
                  onCheckedChange={(checked) => setDatesFlexible(checked === true)}
                />
                <Label htmlFor="flexible" className="text-sm text-muted-foreground cursor-pointer">
                  I'm flexible on dates
                </Label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="itinerary" className="text-base font-medium">Sample Itinerary</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Give us an idea of how you'd structure the retreat. This helps us match you with the right venue and team.
              </p>
              <Textarea
                id="itinerary"
                value={sampleItinerary}
                onChange={(e) => setSampleItinerary(e.target.value)}
                placeholder={`Day 1:
Morning: Welcome & Opening Circle
Afternoon: Yoga Session + Lunch
Evening: Sound Bath & Dinner

Day 2:
Morning: Sunrise Meditation
Afternoon: Breathwork Workshop
Evening: Community Dinner & Sharing Circle

Day 3:
Morning: Integration Session
Afternoon: Closing Ceremony & Departure`}
                className="mt-2 min-h-[300px] font-mono text-sm"
              />
            </div>

            <Card className="bg-accent/50 border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Pro Tip</p>
                  <p className="text-muted-foreground">
                    Include a mix of structured activities and free time. The best retreats give participants space to process and integrate.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card className="bg-accent/30">
              <CardHeader>
                <CardTitle className="text-xl">{title || 'Your Retreat'}</CardTitle>
                <CardDescription>{selectedExpertise.join(', ') || 'Wellness retreat'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Vision</p>
                  <p className="text-foreground">{whatYouOffer || 'Not specified'}</p>
                </div>

                {earningsPerPerson && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Earnings</p>
                    <p className="text-foreground">${parseFloat(earningsPerPerson).toLocaleString()} per person</p>
                  </div>
                )}

                {selectedNeeds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">What You Need</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNeeds.map((needId) => {
                        const need = needsOptions.find(n => n.id === needId);
                        return (
                          <Badge key={needId} variant="secondary">
                            {need?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sampleItinerary && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sample Itinerary</p>
                    <p className="text-foreground text-sm whitespace-pre-line">{sampleItinerary.slice(0, 200)}...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">What happens next?</p>
                  <p className="text-muted-foreground">
                    Our team will review your submission and reach out to discuss your vision.
                    We'll then match you with venues, co-hosts, and staff to bring your retreat to life.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-2xl font-bold text-foreground">Submit a Retreat</h1>
            <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-1 text-xs ${
                  i <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <step.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="h-5 w-5 text-primary" />;
              })()}
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Retreat'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
