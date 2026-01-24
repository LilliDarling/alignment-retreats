import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign, Calendar, Users, CreditCard } from 'lucide-react';

type RoleType = 'host' | 'venue' | 'cohost' | 'chef' | 'staff';
type FeeType = 'flat' | 'per_person' | 'per_night' | 'per_person_night' | 'percentage';

interface EarningsCalculatorProps {
  defaultRole?: RoleType;
}

const roleLabels: Record<RoleType, string> = {
  host: 'Host',
  venue: 'Venue Owner',
  cohost: 'Co-Host',
  chef: 'Chef',
  staff: 'Staff',
};

const feeTypeLabels: Record<FeeType, string> = {
  flat: 'Flat Fee',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_person_night: 'Per Person/Night',
  percentage: 'Percentage of Revenue',
};

const defaultFeeByRole: Record<RoleType, { type: FeeType; amount: number }> = {
  host: { type: 'percentage', amount: 100 },
  venue: { type: 'per_night', amount: 1500 },
  cohost: { type: 'percentage', amount: 15 },
  chef: { type: 'per_person_night', amount: 75 },
  staff: { type: 'flat', amount: 2000 },
};

export function EarningsCalculator({ defaultRole = 'cohost' }: EarningsCalculatorProps) {
  const [attendees, setAttendees] = useState(20);
  const [nights, setNights] = useState(7);
  const [pricePerPerson, setPricePerPerson] = useState(2000);
  const [role, setRole] = useState<RoleType>(defaultRole);
  const isHost = role === 'host';
  const [feeType, setFeeType] = useState<FeeType>(defaultFeeByRole[defaultRole].type);
  const [feeAmount, setFeeAmount] = useState(defaultFeeByRole[defaultRole].amount);

  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setFeeType(defaultFeeByRole[newRole].type);
    setFeeAmount(defaultFeeByRole[newRole].amount);
  };

  const totalRevenue = attendees * pricePerPerson;

  const calculateEarnings = (): number => {
    switch (feeType) {
      case 'flat':
        return feeAmount;
      case 'per_person':
        return feeAmount * attendees;
      case 'per_night':
        return feeAmount * nights;
      case 'per_person_night':
        return feeAmount * attendees * nights;
      case 'percentage':
        return (feeAmount / 100) * totalRevenue;
      default:
        return 0;
    }
  };

  const earnings = calculateEarnings();
  const depositAmount = earnings * 0.5;
  const finalAmount = earnings * 0.5;

  const getBreakdownText = (): string => {
    switch (feeType) {
      case 'flat':
        return `Flat fee of $${feeAmount.toLocaleString()}`;
      case 'per_person':
        return `$${feeAmount.toLocaleString()}/person × ${attendees} attendees`;
      case 'per_night':
        return `$${feeAmount.toLocaleString()}/night × ${nights} nights`;
      case 'per_person_night':
        return `$${feeAmount.toLocaleString()}/person/night × ${attendees} attendees × ${nights} nights`;
      case 'percentage':
        return `${feeAmount}% of $${totalRevenue.toLocaleString()} total revenue`;
      default:
        return '';
    }
  };

  const getFeeInputLabel = (): string => {
    switch (feeType) {
      case 'flat':
        return 'Total Fee ($)';
      case 'per_person':
        return 'Fee Per Person ($)';
      case 'per_night':
        return 'Fee Per Night ($)';
      case 'per_person_night':
        return 'Fee Per Person/Night ($)';
      case 'percentage':
        return 'Percentage (%)';
      default:
        return 'Fee Amount';
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-accent/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="h-5 w-5 text-primary" />
          {isHost ? 'Revenue Calculator' : 'Earnings Calculator'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your Role</Label>
          <Select value={role} onValueChange={(v) => handleRoleChange(v as RoleType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sliders */}
        <div className="space-y-5 pt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                Attendees
              </Label>
              <span className="font-semibold text-foreground">{attendees}</span>
            </div>
            <Slider
              value={[attendees]}
              onValueChange={(v) => setAttendees(v[0])}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Nights
              </Label>
              <span className="font-semibold text-foreground">{nights}</span>
            </div>
            <Slider
              value={[nights]}
              onValueChange={(v) => setNights(v[0])}
              min={1}
              max={14}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Price per Person
              </Label>
              <span className="font-semibold text-foreground">${pricePerPerson.toLocaleString()}</span>
            </div>
            <Slider
              value={[pricePerPerson]}
              onValueChange={(v) => setPricePerPerson(v[0])}
              min={500}
              max={5000}
              step={100}
              className="w-full"
            />
          </div>
        </div>

        {/* Fee Structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fee Structure</Label>
            <Select value={feeType} onValueChange={(v) => setFeeType(v as FeeType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(feeTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{getFeeInputLabel()}</Label>
            <Input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(Number(e.target.value))}
              min={0}
              className="w-full"
            />
          </div>
        </div>

        {/* Earnings Display */}
        <div className="mt-6 p-5 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">
            {isHost ? 'Your Potential Revenue' : 'Your Potential Earnings'}
          </p>
          <p className="text-4xl font-bold text-primary mb-2">
            ${earnings.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            {getBreakdownText()}
          </p>
          {isHost && (
            <p className="text-xs text-muted-foreground mt-2">
              Gross revenue before collaborator payments
            </p>
          )}
        </div>

        {/* Payout Schedule */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Payment Schedule</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">50% on booking confirmation</span>
              <span className="font-semibold text-foreground">${depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">50% one week before retreat</span>
              <span className="font-semibold text-foreground">${finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
