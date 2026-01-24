import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Wallet, Check, ChevronLeft, ChevronRight, ExternalLink, Calendar } from 'lucide-react';

const CALENDLY_URL = 'https://calendly.com/mathew-vetten/co-op-onboarding';

interface CoopQuestionStepProps {
  onComplete: (interested: boolean) => void;
  onBack: () => void;
  initialValue?: boolean | null;
}

export function CoopQuestionStep({ onComplete, onBack, initialValue }: CoopQuestionStepProps) {
  const [selected, setSelected] = useState<'coop' | 'standard' | null>(
    initialValue === true ? 'coop' : initialValue === false ? 'standard' : null
  );

  const handleContinue = () => {
    if (selected === null) return;
    onComplete(selected === 'coop');
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">How would you like to work with venues?</CardTitle>
        <CardDescription>
          Choose how you want to handle venue deposits for retreats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Co-op Option */}
        <button
          type="button"
          onClick={() => setSelected('coop')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selected === 'coop'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg shrink-0 ${selected === 'coop' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Become a Co-Op Member</p>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Founding Member
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Pay a one-time buy-in ($1,000–$2,000) and never pay upfront venue deposits.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>No upfront venue deposits—ever</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Vote on platform decisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Earn dividends from platform revenue</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Limited to 100 founding members</span>
                </li>
              </ul>
              {selected === 'coop' && (
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule your co-op application call
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {selected === 'coop' && (
              <Check className="h-5 w-5 text-primary shrink-0" />
            )}
          </div>
        </button>

        {/* Standard Option */}
        <button
          type="button"
          onClick={() => setSelected('standard')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selected === 'standard'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg shrink-0 ${selected === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">Pay Venue Deposits</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pay 50% of the venue fee upfront before each retreat. This deposit is recovered when attendees book.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span>No membership fee required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span>50% venue deposit due before retreat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span>Full platform access</span>
                </li>
              </ul>
            </div>
            {selected === 'standard' && (
              <Check className="h-5 w-5 text-primary shrink-0" />
            )}
          </div>
        </button>

        {/* Learn more link */}
        <div className="text-center pt-2">
          <a
            href="https://alignmentretreats.xyz/cooperative"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Learn more about the co-op
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="pt-4 flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {selected === 'coop' ? (
            <Button asChild>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Application Call
              </a>
            </Button>
          ) : (
            <Button onClick={handleContinue} disabled={selected === null}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
