import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  Lightbulb,
  Check,
  Home,
  UserPlus,
  UtensilsCrossed,
  Wrench,
  TrendingUp,
  Star
} from 'lucide-react';

// Shared options
const RETREAT_TYPES = [
  'Wellness & Yoga',
  'Corporate & Team Building', 
  'Mastermind & Networking',
  'Skill Development',
  'Creative & Branding',
  'Spiritual & Mindfulness'
];

const LOCATION_PREFERENCES = [
  'Beach/Ocean', 'Mountains', 'Desert', 'Forest', 'Lake',
  'Tropical', 'Urban', 'Countryside', 'Island'
];

const TIMEFRAME_OPTIONS = [
  'Next 1-3 months', 'Next 3-6 months', 'Next 6-12 months', 'Flexible / Anytime'
];

const NEEDS_OPTIONS = [
  { key: 'venue', label: 'Venue / Property', icon: Home },
  { key: 'cohost', label: 'Co-Host', icon: UserPlus },
  { key: 'chef', label: 'Chef / Catering', icon: UtensilsCrossed },
  { key: 'staff', label: 'Support Staff', icon: Wrench },
];

type UserRole = 'host' | 'attendee';

interface BuildRetreatWizardProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function BuildRetreatWizard({ onClose, onSuccess }: BuildRetreatWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Host flow state
  const [hostData, setHostData] = useState({
    title: '',
    description: '',
    retreatType: '',
    whatYouOffer: '',
    needs: [] as string[],
    venueBudgetPerPersonPerNight: 150,
    cohostFeePerPerson: 100,
    cohostFeeType: 'per_person' as 'per_person' | 'percentage',
    cohostPercentage: 10,
    staffDayRate: 300,
    chefDayRate: 400,
    targetAttendeesMin: 8,
    targetAttendeesMax: 20,
    nights: 4,
    hostFeePerPerson: 200,
    preferredTimeframe: '',
    datesFlexible: true,
    sampleItinerary: '',
  });

  // Attendee flow state
  const [attendeeData, setAttendeeData] = useState({
    retreatTypes: [] as string[],
    desiredExperiences: [] as string[],
    description: '',
    preferredTimeframe: '',
    locationPreferences: [] as string[],
    internationalOk: false,
    budgetMin: 3000,
    budgetMax: 5000,
    budgetFlexibility: 'moderate' as 'strict' | 'moderate' | 'flexible',
    groupSize: 1,
    bringingOthers: false,
    priority: null as 'price' | 'quality' | 'location' | 'experience' | 'balanced' | null,
  });

  const [profileLoaded, setProfileLoaded] = useState(false);

  // Check for pending dream retreat after signup
  useEffect(() => {
    const pending = localStorage.getItem('pendingDreamRetreat');
    if (pending && user) {
      try {
        const savedData = JSON.parse(pending);
        setAttendeeData(savedData);
        setRole('attendee');
        setStep(3); // Go to Review step
        localStorage.removeItem('pendingDreamRetreat');
        
        toast({
          title: 'Welcome back!',
          description: 'Review your dream retreat and submit.',
        });
      } catch (e) {
        console.error('Error parsing pending retreat:', e);
        localStorage.removeItem('pendingDreamRetreat');
      }
    }
  }, [user, toast]);

  // Pre-fill from existing profile
  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (!user || profileLoaded) return;

      try {
        const { data: hostProfile } = await supabase
          .from('hosts')
          .select('expertise_areas, min_rate, max_rate, marketing_description')
          .eq('user_id', user.id)
          .single();

        if (hostProfile) {
          setHostData(prev => ({
            ...prev,
            retreatType: hostProfile.expertise_areas?.[0] || prev.retreatType,
            whatYouOffer: hostProfile.marketing_description || prev.whatYouOffer,
            hostFeePerPerson: hostProfile.min_rate 
              ? Math.round((hostProfile.min_rate + (hostProfile.max_rate || hostProfile.min_rate)) / 2)
              : prev.hostFeePerPerson,
          }));
        }

        setProfileLoaded(true);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchExistingProfile();
  }, [user, profileLoaded]);

  const hostSteps = [
    { title: 'Your Vision', icon: Lightbulb },
    { title: 'What You Need', icon: Target },
    { title: 'Your Fee', icon: DollarSign },
    { title: 'Earnings Preview', icon: TrendingUp },
    { title: 'Timeline', icon: Calendar },
    { title: 'Review', icon: Check },
  ];

  const attendeeSteps = [
    { title: 'Experience', icon: Heart },
    { title: 'When & Where', icon: MapPin },
    { title: 'Budget', icon: DollarSign },
    { title: 'Review', icon: Check },
  ];

  const currentSteps = role === 'host' ? hostSteps : attendeeSteps;
  const totalSteps = currentSteps.length;
  const progress = role ? ((step + 1) / totalSteps) * 100 : 0;

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    setter(array.includes(item) ? array.filter(i => i !== item) : [...array, item]);
  };

  const handleHostSubmit = async () => {
    if (!user) {
      onClose?.();
      navigate('/login', { state: { returnTo: '/build-retreat' } });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: hostError } = await supabase.from('hosts').upsert({
        user_id: user.id,
        expertise_areas: hostData.retreatType ? [hostData.retreatType] : [],
        min_rate: Math.max(hostData.hostFeePerPerson - 50, 50),
        max_rate: hostData.hostFeePerPerson + 200,
      }, {
        onConflict: 'user_id',
      });

      if (hostError) {
        console.error('Error updating host profile:', hostError);
      }

      const attendees = Math.floor((hostData.targetAttendeesMin + hostData.targetAttendeesMax) / 2);
      const venueCostPerPerson = hostData.needs.includes('venue') 
        ? hostData.venueBudgetPerPersonPerNight * hostData.nights 
        : 0;
      const cohostCost = hostData.needs.includes('cohost')
        ? (hostData.cohostFeeType === 'per_person' ? hostData.cohostFeePerPerson : 0)
        : 0;
      const staffCost = hostData.needs.includes('staff') ? (hostData.staffDayRate * hostData.nights) / attendees : 0;
      const chefCost = hostData.needs.includes('chef') ? (hostData.chefDayRate * hostData.nights) / attendees : 0;
      const calculatedPricePerPerson = hostData.hostFeePerPerson + venueCostPerPerson + cohostCost + staffCost + chefCost;

      const { error } = await supabase.from('retreats').insert({
        host_user_id: user.id,
        title: hostData.title,
        description: hostData.description,
        retreat_type: hostData.retreatType,
        what_you_offer: hostData.whatYouOffer,
        looking_for: { 
          needs: hostData.needs,
          venueBudgetPerPersonPerNight: hostData.venueBudgetPerPersonPerNight,
          cohostFeePerPerson: hostData.cohostFeePerPerson,
          cohostFeeType: hostData.cohostFeeType,
          cohostPercentage: hostData.cohostPercentage,
          staffDayRate: hostData.staffDayRate,
          chefDayRate: hostData.chefDayRate,
          hostFeePerPerson: hostData.hostFeePerPerson,
          nights: hostData.nights,
        },
        target_attendees_min: hostData.targetAttendeesMin,
        target_attendees_max: hostData.targetAttendeesMax,
        price_per_person: Math.round(calculatedPricePerPerson),
        preferred_dates_flexible: hostData.datesFlexible,
        sample_itinerary: hostData.sampleItinerary,
        status: 'pending_review',
      });

      if (error) throw error;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      const existingOnboarding = (existingProfile?.onboarding_completed as Record<string, unknown>) || {};
      
      await supabase.from('profiles').update({
        onboarding_completed: {
          ...existingOnboarding,
          host: true,
          host_completed_at: new Date().toISOString(),
        }
      }).eq('id', user.id);

      await supabase.from('admin_notifications').insert({
        type: 'retreat_submission',
        title: 'New Retreat Submission',
        message: `${hostData.title} submitted for review`,
        reference_type: 'retreat',
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      await supabase.functions.invoke('notify-retreat-submission', {
        body: {
          title: hostData.title,
          expertise: hostData.retreatType ? [hostData.retreatType] : [],
          whatYouOffer: hostData.whatYouOffer,
          needs: hostData.needs,
          needsNotes: {},
          earningsPerPerson: hostData.hostFeePerPerson.toString(),
          preferredDates: hostData.preferredTimeframe,
          datesFlexible: hostData.datesFlexible,
          sampleItinerary: hostData.sampleItinerary,
          submitterName: profile?.name || 'Unknown',
          submitterEmail: user.email || 'Unknown',
        },
      });

      toast({
        title: 'Retreat submitted!',
        description: 'Our team will review your retreat and get back to you soon.',
      });
      
      onSuccess?.();
      onClose?.();
      navigate('/dashboard/host');
    } catch (error) {
      console.error('Error submitting retreat:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit retreat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttendeeSubmit = async () => {
    if (!user) {
      // Save their work to localStorage so they don't lose it
      localStorage.setItem('pendingDreamRetreat', JSON.stringify(attendeeData));
      
      toast({
        title: 'Almost there!',
        description: 'Create a quick account to save your dream retreat.',
      });
      
      onClose?.();
      navigate('/signup/attendee', { 
        state: { returnTo: '/build-retreat', hasPendingRetreat: true } 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('retreat_wishes').insert({
        user_id: user.id,
        retreat_types: attendeeData.retreatTypes,
        desired_experiences: attendeeData.desiredExperiences,
        description: attendeeData.description,
        preferred_timeframe: attendeeData.preferredTimeframe,
        location_preferences: attendeeData.locationPreferences,
        international_ok: attendeeData.internationalOk,
        budget_min: attendeeData.budgetMin,
        budget_max: attendeeData.budgetMax,
        budget_flexibility: attendeeData.budgetFlexibility,
        group_size: attendeeData.groupSize,
        bringing_others: attendeeData.bringingOthers,
        priority: attendeeData.priority,
      }).select();

      if (error) throw error;

      // Create admin notification
      await supabase.from('admin_notifications').insert({
        type: 'attendee_wish',
        title: 'New Dream Retreat Submission',
        message: `Someone is looking for a ${attendeeData.retreatTypes.length > 0 ? attendeeData.retreatTypes[0] : 'retreat'} experience ($${attendeeData.budgetMin}-$${attendeeData.budgetMax})`,
        reference_type: 'retreat_wish',
      });

      // Get user profile for email notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // Send email notification (fire and forget)
      await supabase.functions.invoke('notify-attendee-wish', {
        body: {
          retreatTypes: attendeeData.retreatTypes,
          desiredExperiences: attendeeData.desiredExperiences,
          description: attendeeData.description,
          preferredTimeframe: attendeeData.preferredTimeframe,
          locationPreferences: attendeeData.locationPreferences,
          internationalOk: attendeeData.internationalOk,
          budgetMin: attendeeData.budgetMin,
          budgetMax: attendeeData.budgetMax,
          budgetFlexibility: attendeeData.budgetFlexibility,
          groupSize: attendeeData.groupSize,
          bringingOthers: attendeeData.bringingOthers,
          priority: attendeeData.priority,
          submitterName: profile?.name || 'Unknown',
          submitterEmail: user.email || 'Unknown',
        },
      });
      
      toast({
        title: 'Dream retreat saved!',
        description: 'We\'ll notify you when matching retreats become available.',
      });
      
      onSuccess?.();
      onClose?.();
      navigate('/dashboard/attendee');
    } catch (error) {
      console.error('Error submitting wish:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    // Only require auth for hosts (collaborators need accounts upfront)
    if (selectedRole === 'host' && !user) {
      toast({
        title: 'Create an account first',
        description: 'Sign up to save your retreat details and get matched with partners.',
      });
      onClose?.();
      navigate('/signup', { 
        state: { 
          returnTo: '/build-retreat',
          defaultRole: 'host'
        } 
      });
      return;
    }
    // Attendees can proceed without auth - they'll sign up at the end
    setRole(selectedRole);
  };

  // Role Selection
  if (!role) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Build Your Perfect Retreat
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're creating an experience or seeking one, we'll help you make it happen.
          </p>
        </div>

        {/* Mobile: Attend first, Host smaller below */}
        <div className="flex flex-col gap-4 md:hidden">
          <Card
            className="cursor-pointer border-2 border-primary hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => handleRoleSelect('attendee')}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                I want to ATTEND
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Describe your dream retreat and get notified when matching experiences become available.
              </p>
              <Button className="w-full rounded-full">
                Build My Retreat
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div 
            className="cursor-pointer text-center p-3 border rounded-xl hover:bg-accent transition-all"
            onClick={() => handleRoleSelect('host')}
          >
            <div className="flex items-center justify-center gap-3">
              <Leaf className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                I Want to Host
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Desktop: Side by side - ATTEND on left, HOST on right */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <Card
            className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => handleRoleSelect('attendee')}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                I want to ATTEND
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Tell us your dream retreat and we'll match you with experiences.
              </p>
              <Button className="w-full rounded-full" variant="outline">
                Build My Retreat
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg group"
            onClick={() => handleRoleSelect('host')}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-secondary/10 mb-4 group-hover:bg-secondary/20 transition-colors">
                <Leaf className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                I want to HOST
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Lead a transformative retreat. Get matched with venues, co-hosts, and staff.
              </p>
              <Button className="w-full rounded-full" variant="outline">
                Start Building
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // HOST FLOW
  const renderHostStep = () => {
    switch (step) {
      case 0: // Vision
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <Label htmlFor="title">Retreat Title *</Label>
              <Input
                id="title"
                value={hostData.title}
                onChange={e => setHostData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Sacred Awakening Yoga Retreat"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Retreat Type</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {RETREAT_TYPES.map(type => (
                  <Badge
                    key={type}
                    variant={hostData.retreatType === type ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                    onClick={() => setHostData(prev => ({ ...prev, retreatType: type }))}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="whatYouOffer">What You Bring</Label>
              <Textarea
                id="whatYouOffer"
                value={hostData.whatYouOffer}
                onChange={e => setHostData(prev => ({ ...prev, whatYouOffer: e.target.value }))}
                placeholder="Your expertise, certifications, unique teaching style..."
                className="mt-2 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="description">Retreat Vision</Label>
              <Textarea
                id="description"
                value={hostData.description}
                onChange={e => setHostData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the transformation you want to create..."
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
        );

      case 1: // What You Need
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">What do you need?</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select all that apply - we'll help match you with the right partners
              </p>
              <div className="grid grid-cols-2 gap-3">
                {NEEDS_OPTIONS.map(option => {
                  const Icon = option.icon;
                  const isSelected = hostData.needs.includes(option.key);
                  return (
                    <Card
                      key={option.key}
                      className={`cursor-pointer border-2 transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                      }`}
                      onClick={() => toggleArrayItem(hostData.needs, option.key, arr => 
                        setHostData(prev => ({ ...prev, needs: arr }))
                      )}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-accent'}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="font-medium">{option.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2: // Your Fee
        return (
          <div className="space-y-8 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">Your Host Fee (per person)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                This is what you'll earn per attendee for leading the retreat
              </p>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-primary">${hostData.hostFeePerPerson}</span>
                <span className="text-muted-foreground ml-2">per person</span>
              </div>
              <Slider
                value={[hostData.hostFeePerPerson]}
                onValueChange={([val]) => setHostData(prev => ({ ...prev, hostFeePerPerson: val }))}
                min={50}
                max={1000}
                step={25}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Target Group Size</Label>
              <p className="text-sm text-muted-foreground mb-4">
                {hostData.targetAttendeesMin} - {hostData.targetAttendeesMax} attendees
              </p>
              <Slider
                value={[hostData.targetAttendeesMin, hostData.targetAttendeesMax]}
                onValueChange={([min, max]) => setHostData(prev => ({ 
                  ...prev, 
                  targetAttendeesMin: min, 
                  targetAttendeesMax: max 
                }))}
                min={4}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Retreat Duration</Label>
              <p className="text-sm text-muted-foreground mb-4">
                {hostData.nights} nights
              </p>
              <Slider
                value={[hostData.nights]}
                onValueChange={([val]) => setHostData(prev => ({ ...prev, nights: val }))}
                min={1}
                max={14}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 3: // Earnings Preview
        {
          const attendeesPreview = Math.floor((hostData.targetAttendeesMin + hostData.targetAttendeesMax) / 2);
          const hostEarnings = hostData.hostFeePerPerson * attendeesPreview;
          
          const venueCost = hostData.needs.includes('venue') 
            ? hostData.venueBudgetPerPersonPerNight * attendeesPreview * hostData.nights 
            : 0;
          const cohostCost = hostData.needs.includes('cohost')
            ? (hostData.cohostFeeType === 'per_person' 
                ? hostData.cohostFeePerPerson * attendeesPreview 
                : (hostEarnings * hostData.cohostPercentage) / 100)
            : 0;
          const staffCost = hostData.needs.includes('staff') ? hostData.staffDayRate * hostData.nights : 0;
          const chefCost = hostData.needs.includes('chef') ? hostData.chefDayRate * hostData.nights : 0;
          
          const totalCosts = venueCost + cohostCost + staffCost + chefCost;
          const grossRevenue = hostEarnings + totalCosts;
          const pricePerPerson = Math.round(grossRevenue / attendeesPreview);
          
          return (
            <div className="space-y-6 max-w-lg mx-auto">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Projected Earnings</p>
                  <p className="text-5xl font-bold text-primary mb-2">${hostEarnings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    ${hostData.hostFeePerPerson}/person × {attendeesPreview} attendees
                  </p>
                </CardContent>
              </Card>

              <div className="px-4">
                <Label className="text-sm font-medium">Preview with different group sizes</Label>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground w-12">{hostData.targetAttendeesMin}</span>
                  <Slider
                    value={[hostData.targetAttendeesMin, hostData.targetAttendeesMax]}
                    onValueChange={([min, max]) => setHostData(prev => ({ 
                      ...prev, 
                      targetAttendeesMin: min, 
                      targetAttendeesMax: max 
                    }))}
                    min={4}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">{hostData.targetAttendeesMax}</span>
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Suggested Ticket Price</span>
                    <span className="text-2xl font-bold">${pricePerPerson}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your fee + estimated team costs
                  </p>
                </CardContent>
              </Card>

              {hostData.needs.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Estimated Team Costs</p>
                    
                    {hostData.needs.includes('venue') && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>Venue</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${venueCost.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">
                            ${hostData.venueBudgetPerPersonPerNight}/person/night
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {hostData.needs.includes('cohost') && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span>Co-Host</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${Math.round(cohostCost).toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">
                            {hostData.cohostFeeType === 'per_person' 
                              ? `$${hostData.cohostFeePerPerson}/person` 
                              : `${hostData.cohostPercentage}% of tickets`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {hostData.needs.includes('chef') && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          <span>Chef</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${chefCost.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">
                            ${hostData.chefDayRate}/day × {hostData.nights} nights
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {hostData.needs.includes('staff') && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span>Staff</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">${staffCost.toLocaleString()}</span>
                          <p className="text-xs text-muted-foreground">
                            ${hostData.staffDayRate}/day × {hostData.nights} nights
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex items-center justify-between font-medium">
                      <span>Total Gross Revenue</span>
                      <span className="text-lg">${grossRevenue.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hostData.needs.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm font-medium">Adjust Team Rates</p>
                    
                    {hostData.needs.includes('venue') && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Venue (per person/night)</span>
                          <span className="font-medium">${hostData.venueBudgetPerPersonPerNight}</span>
                        </div>
                        <Slider
                          value={[hostData.venueBudgetPerPersonPerNight]}
                          onValueChange={([val]) => setHostData(prev => ({ ...prev, venueBudgetPerPersonPerNight: val }))}
                          min={50}
                          max={500}
                          step={10}
                        />
                      </div>
                    )}
                    
                    {hostData.needs.includes('cohost') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={hostData.cohostFeeType === 'per_person' ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setHostData(prev => ({ ...prev, cohostFeeType: 'per_person' }))}
                          >
                            Per Person
                          </Badge>
                          <Badge 
                            variant={hostData.cohostFeeType === 'percentage' ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setHostData(prev => ({ ...prev, cohostFeeType: 'percentage' }))}
                          >
                            % of Tickets
                          </Badge>
                        </div>
                        {hostData.cohostFeeType === 'per_person' ? (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Co-Host (per person)</span>
                              <span className="font-medium">${hostData.cohostFeePerPerson}</span>
                            </div>
                            <Slider
                              value={[hostData.cohostFeePerPerson]}
                              onValueChange={([val]) => setHostData(prev => ({ ...prev, cohostFeePerPerson: val }))}
                              min={25}
                              max={300}
                              step={25}
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Co-Host (% of tickets)</span>
                              <span className="font-medium">{hostData.cohostPercentage}%</span>
                            </div>
                            <Slider
                              value={[hostData.cohostPercentage]}
                              onValueChange={([val]) => setHostData(prev => ({ ...prev, cohostPercentage: val }))}
                              min={5}
                              max={50}
                              step={5}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {hostData.needs.includes('chef') && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Chef (per day)</span>
                          <span className="font-medium">${hostData.chefDayRate}</span>
                        </div>
                        <Slider
                          value={[hostData.chefDayRate]}
                          onValueChange={([val]) => setHostData(prev => ({ ...prev, chefDayRate: val }))}
                          min={100}
                          max={1000}
                          step={50}
                        />
                      </div>
                    )}
                    
                    {hostData.needs.includes('staff') && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Staff (per day)</span>
                          <span className="font-medium">${hostData.staffDayRate}</span>
                        </div>
                        <Slider
                          value={[hostData.staffDayRate]}
                          onValueChange={([val]) => setHostData(prev => ({ ...prev, staffDayRate: val }))}
                          min={100}
                          max={800}
                          step={50}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

      case 4: // Timeline
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">When do you want to host?</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {TIMEFRAME_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={hostData.preferredTimeframe === option ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-3 justify-center text-sm transition-all hover:scale-105"
                    onClick={() => setHostData(prev => ({ ...prev, preferredTimeframe: option }))}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-base font-medium">Dates Flexible?</Label>
                <p className="text-sm text-muted-foreground">
                  We can work with you to find the best dates
                </p>
              </div>
              <Switch
                checked={hostData.datesFlexible}
                onCheckedChange={val => setHostData(prev => ({ ...prev, datesFlexible: val }))}
              />
            </div>

            <div>
              <Label htmlFor="itinerary">Sample Itinerary (Optional)</Label>
              <Textarea
                id="itinerary"
                value={hostData.sampleItinerary}
                onChange={e => setHostData(prev => ({ ...prev, sampleItinerary: e.target.value }))}
                placeholder="Day 1: Arrival and welcome ceremony...&#10;Day 2: Morning yoga, afternoon workshop..."
                className="mt-2 min-h-[150px]"
              />
            </div>
          </div>
        );

      case 5: // Review
        {
          const attendeesReview = Math.floor((hostData.targetAttendeesMin + hostData.targetAttendeesMax) / 2);
          const hostEarningsReview = hostData.hostFeePerPerson * attendeesReview;
          const venueCostReview = hostData.needs.includes('venue') 
            ? hostData.venueBudgetPerPersonPerNight * attendeesReview * hostData.nights 
            : 0;
          const cohostCostReview = hostData.needs.includes('cohost')
            ? (hostData.cohostFeeType === 'per_person' 
                ? hostData.cohostFeePerPerson * attendeesReview 
                : (hostEarningsReview * hostData.cohostPercentage) / 100)
            : 0;
          const staffCostReview = hostData.needs.includes('staff') ? hostData.staffDayRate * hostData.nights : 0;
          const chefCostReview = hostData.needs.includes('chef') ? hostData.chefDayRate * hostData.nights : 0;
          const totalCostsReview = venueCostReview + cohostCostReview + staffCostReview + chefCostReview;
          const grossRevenueReview = hostEarningsReview + totalCostsReview;
          const pricePerPersonReview = Math.round(grossRevenueReview / attendeesReview);
          
          return (
            <div className="space-y-6 max-w-lg mx-auto">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">{hostData.title || 'Your Retreat'}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{hostData.retreatType || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Group Size:</span>
                      <p className="font-medium">{hostData.targetAttendeesMin}-{hostData.targetAttendeesMax}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{hostData.nights} nights</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeline:</span>
                      <p className="font-medium">{hostData.preferredTimeframe || 'Flexible'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Your Host Fee:</span>
                      <span className="font-bold text-primary">${hostData.hostFeePerPerson}/person</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Suggested Ticket Price:</span>
                      <span className="font-bold">${pricePerPersonReview}/person</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Projected Earnings:</span>
                      <span className="font-bold text-primary">${hostEarningsReview.toLocaleString()}</span>
                    </div>
                  </div>

                  {hostData.needs.length > 0 && (
                    <div className="border-t pt-4">
                      <span className="text-muted-foreground text-sm">Looking for:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hostData.needs.map(need => (
                          <Badge key={need} variant="secondary" className="capitalize">{need}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

      default:
        return null;
    }
  };

  // ATTENDEE FLOW
  const renderAttendeeStep = () => {
    switch (step) {
      case 0: // Experience
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">What types of retreats interest you?</Label>
              <div className="flex flex-wrap gap-2 mt-4">
                {RETREAT_TYPES.map(type => (
                  <Badge
                    key={type}
                    variant={attendeeData.retreatTypes.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                    onClick={() => toggleArrayItem(attendeeData.retreatTypes, type, arr => 
                      setAttendeeData(prev => ({ ...prev, retreatTypes: arr }))
                    )}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Describe your ideal retreat</Label>
              <Textarea
                id="description"
                value={attendeeData.description}
                onChange={e => setAttendeeData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What transformation are you seeking? What experiences matter most to you?"
                className="mt-2 min-h-[120px]"
              />
            </div>
          </div>
        );

      case 1: // When & Where
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">When would you like to go?</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {TIMEFRAME_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={attendeeData.preferredTimeframe === option ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-3 justify-center text-sm transition-all hover:scale-105"
                    onClick={() => setAttendeeData(prev => ({ ...prev, preferredTimeframe: option }))}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Location Preferences</Label>
              <div className="flex flex-wrap gap-2 mt-4">
                {LOCATION_PREFERENCES.map(loc => (
                  <Badge
                    key={loc}
                    variant={attendeeData.locationPreferences.includes(loc) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                    onClick={() => toggleArrayItem(attendeeData.locationPreferences, loc, arr => 
                      setAttendeeData(prev => ({ ...prev, locationPreferences: arr }))
                    )}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-base font-medium">Open to International?</Label>
                <p className="text-sm text-muted-foreground">
                  Include retreats outside your country
                </p>
              </div>
              <Switch
                checked={attendeeData.internationalOk}
                onCheckedChange={val => setAttendeeData(prev => ({ ...prev, internationalOk: val }))}
              />
            </div>
          </div>
        );

      case 2: // Budget
        return (
          <div className="space-y-8 max-w-lg mx-auto">
            <div>
              <Label className="text-base font-medium">Budget Range (per person)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                ${attendeeData.budgetMin} - ${attendeeData.budgetMax}
              </p>
              <Slider
                value={[attendeeData.budgetMin, attendeeData.budgetMax]}
                onValueChange={([min, max]) => setAttendeeData(prev => ({ 
                  ...prev, 
                  budgetMin: min, 
                  budgetMax: max 
                }))}
                min={1000}
                max={25000}
                step={500}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Budget Flexibility</Label>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {(['strict', 'moderate', 'flexible'] as const).map(flex => (
                  <Badge
                    key={flex}
                    variant={attendeeData.budgetFlexibility === flex ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-3 justify-center capitalize transition-all hover:scale-105"
                    onClick={() => setAttendeeData(prev => ({ ...prev, budgetFlexibility: flex }))}
                  >
                    {flex}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Group Size</Label>
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAttendeeData(prev => ({ 
                    ...prev, 
                    groupSize: Math.max(1, prev.groupSize - 1) 
                  }))}
                >
                  -
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{attendeeData.groupSize}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAttendeeData(prev => ({ 
                    ...prev, 
                    groupSize: Math.min(10, prev.groupSize + 1) 
                  }))}
                >
                  +
                </Button>
                <span className="text-muted-foreground">
                  {attendeeData.groupSize === 1 ? 'Just me' : `${attendeeData.groupSize} people`}
                </span>
              </div>
            </div>

            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-primary/20">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <Label className="text-lg font-bold text-foreground">
                  What's most important to you?
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mb-4 ml-12">
                Choose your top priority - this helps us match you with the perfect retreat!
              </p>
              
              {attendeeData.priority === null && (
                <p className="text-sm text-destructive mb-3 ml-12 font-medium">
                  Please select your priority to continue
                </p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'price', label: 'Best Value', desc: 'I want the most for my money' },
                  { key: 'quality', label: 'Premium Quality', desc: 'I want a luxury experience' },
                  { key: 'location', label: 'Perfect Location', desc: 'The destination matters most' },
                  { key: 'experience', label: 'Transformation', desc: 'The personal growth is key' },
                  { key: 'balanced', label: 'Balanced', desc: 'A bit of everything' },
                ] as const).map(option => {
                  const isSelected = attendeeData.priority === option.key;
                  return (
                    <Card
                      key={option.key}
                      className={`cursor-pointer border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]' 
                          : 'hover:border-primary/50 hover:bg-accent'
                      }`}
                      onClick={() => setAttendeeData(prev => ({ ...prev, priority: option.key }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{option.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-6 max-w-lg mx-auto">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Your Dream Retreat</h3>
                
                {attendeeData.retreatTypes.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Interested in:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attendeeData.retreatTypes.map(type => (
                        <Badge key={type} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <p className="font-medium">${attendeeData.budgetMin} - ${attendeeData.budgetMax}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Group Size:</span>
                    <p className="font-medium">{attendeeData.groupSize} {attendeeData.groupSize === 1 ? 'person' : 'people'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timeline:</span>
                    <p className="font-medium">{attendeeData.preferredTimeframe || 'Flexible'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <p className="font-medium capitalize">{attendeeData.priority || 'Not selected'}</p>
                  </div>
                </div>

                {attendeeData.locationPreferences.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Preferred locations:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attendeeData.locationPreferences.map(loc => (
                        <Badge key={loc} variant="outline">{loc}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (role === 'host') {
      if (step === 0) return hostData.title.length > 0;
      return true;
    } else {
      if (step === 0) return attendeeData.retreatTypes.length > 0;
      if (step === 2) return attendeeData.priority !== null;
      return true;
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-3">
          {(() => {
            const Icon = currentSteps[step]?.icon || Leaf;
            return <Icon className="w-7 h-7" />;
          })()}
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {currentSteps[step]?.title}
        </h2>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {role === 'host' ? renderHostStep() : renderAttendeeStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-6 mt-6 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 0) {
              setRole(null);
            } else {
              setStep(step - 1);
            }
          }}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={role === 'host' ? handleHostSubmit : handleAttendeeSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
