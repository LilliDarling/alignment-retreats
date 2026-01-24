import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Leaf, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Calendar, 
  Users,
  Home,
  Handshake,
  Briefcase
} from 'lucide-react';

const retreatTypes = [
  'Yoga & Wellness',
  'Meditation & Mindfulness',
  'Creative & Artistic',
  'Adventure & Outdoor',
  'Spiritual & Healing',
  'Leadership & Personal Growth',
  'Couples & Relationships',
  'Corporate & Team Building',
  'Other',
];

const steps = [
  { id: 1, title: 'Basic Info', icon: FileText },
  { id: 2, title: 'Dates & Capacity', icon: Calendar },
  { id: 3, title: 'Find Resources', icon: Users },
];

export default function CreateRetreat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [retreatType, setRetreatType] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState('');

  const handleSaveDraft = async () => {
    if (!user || !title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your retreat.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('retreats').insert({
      host_user_id: user.id,
      title: title.trim(),
      retreat_type: retreatType || null,
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      price_per_person: pricePerPerson ? parseFloat(pricePerPerson) : null,
      status: 'draft',
    });

    setSaving(false);

    if (error) {
      toast({
        title: 'Error saving retreat',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Draft saved!',
      description: 'Your retreat has been saved as a draft.',
    });

    navigate('/dashboard/host');
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-semibold text-foreground">Alignment Retreats</span>
          </Link>

          <Link to="/dashboard/host">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create a New Retreat</h1>
          <p className="text-muted-foreground">Fill in the details to start building your retreat experience.</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm ${currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Retreat Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mountain Mindfulness Retreat"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Retreat Type</Label>
                  <Select value={retreatType} onValueChange={setRetreatType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {retreatTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your retreat experience..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Dates & Capacity */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min="1"
                      placeholder="e.g., 20"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="earnings">Target Earnings per Person ($)</Label>
                    <p className="text-sm text-muted-foreground">How much do you need to earn per person? We'll calculate the final price based on venue, team, and other costs.</p>
                    <Input
                      id="earnings"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={pricePerPerson}
                      onChange={(e) => setPricePerPerson(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Find Resources */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Find Collaborators & Venues</h3>
                  <p className="text-muted-foreground">Browse available resources for your retreat</p>
                </div>

                <Tabs defaultValue="venues" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="venues" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Venues
                    </TabsTrigger>
                    <TabsTrigger value="cohosts" className="flex items-center gap-2">
                      <Handshake className="h-4 w-4" />
                      Co-hosts
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Staff
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="venues" className="mt-6">
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-semibold text-foreground mb-2">Browse Venues Coming Soon</h4>
                        <p className="text-muted-foreground text-sm">
                          Explore beautiful retreat centers, land, and venues from our community of landowners.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="cohosts" className="mt-6">
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-semibold text-foreground mb-2">Find Co-hosts Coming Soon</h4>
                        <p className="text-muted-foreground text-sm">
                          Connect with experienced facilitators, teachers, and collaborators.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="staff" className="mt-6">
                    <Card className="border-dashed">
                      <CardContent className="p-8 text-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-semibold text-foreground mb-2">Hire Staff Coming Soon</h4>
                        <p className="text-muted-foreground text-sm">
                          Find caterers, photographers, massage therapists, and other service providers.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>

                {currentStep < 3 ? (
                  <Button onClick={nextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSaveDraft} disabled={saving}>
                    {saving ? 'Saving...' : 'Complete & Save'}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}