import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Home, 
  Users, 
  Utensils, 
  Briefcase, 
  HelpCircle,
  TrendingUp,
  DollarSign,
  Calculator,
  PieChart,
  Percent,
  Info,
  ArrowLeft
} from 'lucide-react';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type RoleType = 'venue' | 'cohost' | 'chef' | 'staff' | 'other';
type FeeType = 'flat' | 'per_person' | 'per_night' | 'per_person_per_night' | 'percentage';

interface TeamMember {
  id: string;
  role: RoleType;
  name: string;
  feeType: FeeType;
  feeAmount: number;
}

interface MarketRate {
  role_type: string;
  avg_min_rate: number | null;
  avg_max_rate: number | null;
  count: number;
}

const roleConfig: Record<RoleType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; defaultFeeType: FeeType }> = {
  venue: { icon: Home, label: 'Venue', color: 'hsl(var(--chart-1))', defaultFeeType: 'per_night' },
  cohost: { icon: Users, label: 'Co-Host', color: 'hsl(var(--chart-2))', defaultFeeType: 'flat' },
  chef: { icon: Utensils, label: 'Chef', color: 'hsl(var(--chart-3))', defaultFeeType: 'per_person_per_night' },
  staff: { icon: Briefcase, label: 'Staff', color: 'hsl(var(--chart-4))', defaultFeeType: 'flat' },
  other: { icon: HelpCircle, label: 'Other', color: 'hsl(var(--chart-5))', defaultFeeType: 'flat' },
};

const feeTypeLabels: Record<FeeType, string> = {
  flat: 'Flat Fee',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_person_per_night: 'Per Person/Night',
  percentage: 'Percentage of Ticket',
};

// Map submission needs to builder roles
const needToRoleMap: Record<string, RoleType> = {
  venue: 'venue',
  cohost: 'cohost',
  chef: 'chef',
  photographer: 'staff',
  yoga_instructor: 'staff',
  sound_healer: 'staff',
  massage: 'staff',
  other: 'other',
};

interface RetreatBuilderProps {
  initialSubmission?: {
    id: string;
    title: string;
    max_attendees: number | null;
    price_per_person: number | null;
    looking_for: { needs?: string[]; notes?: Record<string, string> } | null;
  };
}

export default function RetreatBuilder({ initialSubmission }: RetreatBuilderProps) {
  const [attendees, setAttendees] = useState(20);
  const [nights, setNights] = useState(5);
  const [markupPercent, setMarkupPercent] = useState(30);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [marketRates, setMarketRates] = useState<MarketRate[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchMarketRates();
  }, []);

  // Initialize from submission data
  useEffect(() => {
    if (initialSubmission && !initialized) {
      // Set attendees from max_attendees
      if (initialSubmission.max_attendees) {
        setAttendees(initialSubmission.max_attendees);
      }

      // Add team members based on looking_for needs
      const needs = initialSubmission.looking_for?.needs || [];
      const notes = initialSubmission.looking_for?.notes || {};
      
      const newMembers: TeamMember[] = needs.map((needId: string, index: number) => {
        const role = needToRoleMap[needId] || 'other';
        const config = roleConfig[role];
        const needLabel = needId.replace(/_/g, ' ');
        
        return {
          id: crypto.randomUUID(),
          role,
          name: role === 'staff' ? needLabel.charAt(0).toUpperCase() + needLabel.slice(1) : config.label,
          feeType: config.defaultFeeType,
          feeAmount: 0,
        };
      });

      if (newMembers.length > 0) {
        setTeamMembers(newMembers);
      }
      
      setInitialized(true);
    }
  }, [initialSubmission, initialized]);

  const fetchMarketRates = async () => {
    const { data, error } = await supabase.rpc('get_market_rate_averages');
    if (!error && data) {
      setMarketRates(data as MarketRate[]);
    }
  };

  const addTeamMember = (role: RoleType) => {
    const config = roleConfig[role];
    setTeamMembers([
      ...teamMembers,
      {
        id: crypto.randomUUID(),
        role,
        name: `${config.label} ${teamMembers.filter(m => m.role === role).length + 1}`,
        feeType: config.defaultFeeType,
        feeAmount: 0,
      },
    ]);
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  // Calculate member cost - for percentage type, we need to calculate iteratively
  const calculateMemberCost = (member: TeamMember, pricePerPerson: number): number => {
    switch (member.feeType) {
      case 'flat':
        return member.feeAmount;
      case 'per_person':
        return member.feeAmount * attendees;
      case 'per_night':
        return member.feeAmount * nights;
      case 'per_person_per_night':
        return member.feeAmount * attendees * nights;
      case 'percentage':
        return (member.feeAmount / 100) * pricePerPerson * attendees;
      default:
        return 0;
    }
  };

  // Calculate costs by role (excluding percentage-based for initial calculation)
  const costsByRole = useMemo(() => {
    const costs: Record<RoleType, number> = { venue: 0, cohost: 0, chef: 0, staff: 0, other: 0 };
    
    // First calculate non-percentage costs
    teamMembers.forEach(member => {
      if (member.feeType !== 'percentage') {
        costs[member.role] += calculateMemberCost(member, 0);
      }
    });
    
    return costs;
  }, [teamMembers, attendees, nights]);

  // Calculate total non-percentage team costs
  const baseTeamCosts = Object.values(costsByRole).reduce((sum, cost) => sum + cost, 0);
  
  // Calculate cost per person (before percentage fees)
  const baseCostPerPerson = attendees > 0 ? baseTeamCosts / attendees : 0;
  
  // Calculate suggested price per person with markup
  const suggestedPricePerPerson = baseCostPerPerson * (1 + markupPercent / 100);
  
  // Now calculate percentage-based fees using the suggested price
  const percentageFeeCosts = useMemo(() => {
    let total = 0;
    teamMembers.forEach(member => {
      if (member.feeType === 'percentage') {
        total += (member.feeAmount / 100) * suggestedPricePerPerson * attendees;
      }
    });
    return total;
  }, [teamMembers, suggestedPricePerPerson, attendees]);

  // Total team costs including percentage fees
  const totalTeamCosts = baseTeamCosts + percentageFeeCosts;
  
  // Recalculate with percentage fees included
  const actualCostPerPerson = attendees > 0 ? totalTeamCosts / attendees : 0;
  const finalPricePerPerson = actualCostPerPerson * (1 + markupPercent / 100);
  
  // Host's target price from submission
  const hostTargetPrice = initialSubmission?.price_per_person || 0;
  const priceDifference = hostTargetPrice - finalPricePerPerson;
  const canMeetHostPrice = hostTargetPrice > 0 && finalPricePerPerson <= hostTargetPrice;
  const profitAtHostPrice = hostTargetPrice > 0 ? (hostTargetPrice * attendees) - totalTeamCosts : 0;
  const markupAtHostPrice = hostTargetPrice > 0 && actualCostPerPerson > 0 
    ? ((hostTargetPrice - actualCostPerPerson) / actualCostPerPerson) * 100 
    : 0;
  
  // Revenue and profit calculations
  const grossRevenue = finalPricePerPerson * attendees;
  const profit = grossRevenue - totalTeamCosts;
  const markupPerPerson = finalPricePerPerson - actualCostPerPerson;

  // Calculate breakeven - how many attendees needed to cover fixed costs
  const fixedCosts = teamMembers
    .filter(m => m.feeType === 'flat')
    .reduce((sum, m) => sum + m.feeAmount, 0);
  
  const nightlyCosts = teamMembers
    .filter(m => m.feeType === 'per_night')
    .reduce((sum, m) => sum + m.feeAmount * nights, 0);

  const variableCostPerPerson = teamMembers
    .filter(m => m.feeType === 'per_person' || m.feeType === 'per_person_per_night')
    .reduce((sum, m) => {
      if (m.feeType === 'per_person') return sum + m.feeAmount;
      if (m.feeType === 'per_person_per_night') return sum + m.feeAmount * nights;
      return sum;
    }, 0);

  const effectiveRevenuePerPerson = finalPricePerPerson - variableCostPerPerson;
  const breakevenAttendees = effectiveRevenuePerPerson > 0 
    ? Math.ceil((fixedCosts + nightlyCosts) / effectiveRevenuePerPerson)
    : 0;

  // Chart data - calculate full costs by role including percentage fees
  const fullCostsByRole = useMemo(() => {
    const costs: Record<RoleType, number> = { venue: 0, cohost: 0, chef: 0, staff: 0, other: 0 };
    teamMembers.forEach(member => {
      costs[member.role] += calculateMemberCost(member, finalPricePerPerson);
    });
    return costs;
  }, [teamMembers, attendees, nights, finalPricePerPerson]);

  const chartData = [
    { name: 'Venue', value: fullCostsByRole.venue, color: roleConfig.venue.color },
    { name: 'Co-Host', value: fullCostsByRole.cohost, color: roleConfig.cohost.color },
    { name: 'Chef', value: fullCostsByRole.chef, color: roleConfig.chef.color },
    { name: 'Staff', value: fullCostsByRole.staff, color: roleConfig.staff.color },
    { name: 'Other', value: fullCostsByRole.other, color: roleConfig.other.color },
    { name: 'Your Profit', value: Math.max(0, profit), color: 'hsl(var(--primary))' },
  ].filter(item => item.value > 0);

  const getMarketRateHint = (role: RoleType): string | null => {
    const rate = marketRates.find(r => r.role_type === role);
    if (!rate || rate.count === 0) return null;
    if (rate.avg_min_rate && rate.avg_max_rate) {
      return `Market avg: $${rate.avg_min_rate.toLocaleString()} - $${rate.avg_max_rate.toLocaleString()}`;
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Submission Context Banner - Host's Target Price */}
      {initialSubmission && initialSubmission.price_per_person && (
        <Card className="border-2 border-primary/50 bg-primary/10">
          <CardContent className="py-4 sm:py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Pricing for:</span>
                  <Badge variant="secondary" className="font-semibold">{initialSubmission.title}</Badge>
                </div>
                <Link to="/admin" state={{ tab: 'submissions' }}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to Submissions
                  </Button>
                </Link>
              </div>
              
              {/* Host's Target Price - PROMINENT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/20 border border-primary/30">
                  <p className="text-xs text-primary font-medium mb-1">Host Wants to Charge</p>
                  <p className="text-3xl sm:text-4xl font-bold text-primary">
                    ${initialSubmission.price_per_person.toLocaleString()}
                  </p>
                  <p className="text-xs text-primary/80">per person</p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/50 border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Your Calculated Price</p>
                  <p className="text-3xl sm:text-4xl font-bold">
                    ${finalPricePerPerson.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">per person @ {markupPercent}% markup</p>
                </div>
                
                <div className={`p-4 rounded-lg border ${canMeetHostPrice ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <p className="text-xs font-medium mb-1 text-muted-foreground">
                    {canMeetHostPrice ? 'Profit at Host Price' : 'Gap to Host Price'}
                  </p>
                  {canMeetHostPrice ? (
                    <>
                      <p className="text-3xl sm:text-4xl font-bold text-primary">
                        ${profitAtHostPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-primary">
                        {markupAtHostPrice.toFixed(0)}% effective markup
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl sm:text-4xl font-bold text-destructive">
                        -${Math.abs(priceDifference).toFixed(0)}
                      </p>
                      <p className="text-xs text-destructive">need to reduce costs</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Simple banner for submissions without price */}
      {initialSubmission && !initialSubmission.price_per_person && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Pricing for:</span>
                <Badge variant="secondary" className="font-semibold">{initialSubmission.title}</Badge>
                <span className="text-xs text-muted-foreground">(No target price set)</span>
              </div>
              <Link to="/admin" state={{ tab: 'submissions' }}>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to Submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retreat Parameters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Retreat Parameters
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Set the basic parameters for your retreat scenario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Number of Attendees</Label>
                <span className="text-lg sm:text-xl font-bold text-primary">{attendees}</span>
              </div>
              <Slider
                value={[attendees]}
                onValueChange={([v]) => setAttendees(v)}
                min={5}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">5 - 50 people</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Number of Nights</Label>
                <span className="text-lg sm:text-xl font-bold text-primary">{nights}</span>
              </div>
              <Slider
                value={[nights]}
                onValueChange={([v]) => setNights(v)}
                min={1}
                max={14}
                step={1}
              />
              <p className="text-xs text-muted-foreground">1 - 14 nights</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Your Markup</Label>
                <span className="text-lg sm:text-xl font-bold text-primary">{markupPercent}%</span>
              </div>
              <Slider
                value={[markupPercent]}
                onValueChange={([v]) => setMarkupPercent(v)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-muted-foreground">0% - 100% markup on costs</p>
            </div>
          </div>

          <Separator />

          {/* Suggested Price Display */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Team Costs</p>
                  <p className="text-xl sm:text-2xl font-bold text-destructive">${totalTeamCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Cost / Person</p>
                  <p className="text-base sm:text-lg font-semibold">${actualCostPerPerson.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Suggested Ticket Price</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">${finalPricePerPerson.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Gross Revenue</p>
                  <p className="text-base sm:text-lg font-semibold">${grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Cost Builder */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Team Cost Builder
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Add team members and define their fee structures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Add Role Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {(Object.keys(roleConfig) as RoleType[]).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              return (
                <Button
                  key={role}
                  variant="outline"
                  size="sm"
                  onClick={() => addTeamMember(role)}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add</span> {config.label}
                </Button>
              );
            })}
          </div>

          {/* Team Members List */}
          {teamMembers.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No team members added yet.</p>
              <p className="text-xs sm:text-sm">Click the buttons above to add team members.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {teamMembers.map((member) => {
                const config = roleConfig[member.role];
                const Icon = config.icon;
                const cost = calculateMemberCost(member, finalPricePerPerson);
                const marketHint = getMarketRateHint(member.role);

                return (
                  <div
                    key={member.id}
                    className="p-3 sm:p-4 rounded-lg border bg-card"
                    style={{ borderLeftColor: config.color, borderLeftWidth: 4 }}
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(member.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(member.id, { name: e.target.value })}
                        className="h-9 text-sm font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={member.feeType}
                          onValueChange={(v) => updateTeamMember(member.id, { feeType: v as FeeType })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(feeTypeLabels) as FeeType[]).map((type) => (
                              <SelectItem key={type} value={type} className="text-xs">
                                {feeTypeLabels[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative">
                          {member.feeType === 'percentage' ? (
                            <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          ) : (
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          )}
                          <Input
                            type="number"
                            value={member.feeAmount}
                            onChange={(e) => updateTeamMember(member.id, { feeAmount: Number(e.target.value) || 0 })}
                            className="pl-7 h-9 text-sm"
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Total cost</span>
                        <span className="text-lg font-bold">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <Input
                              value={member.name}
                              onChange={(e) => updateTeamMember(member.id, { name: e.target.value })}
                              className="h-8 w-40 text-sm font-medium"
                            />
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-end">
                          <div className="w-48">
                            <Select
                              value={member.feeType}
                              onValueChange={(v) => updateTeamMember(member.id, { feeType: v as FeeType })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(feeTypeLabels) as FeeType[]).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {feeTypeLabels[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-32">
                            <div className="relative">
                              {member.feeType === 'percentage' ? (
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              ) : (
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              )}
                              <Input
                                type="number"
                                value={member.feeAmount}
                                onChange={(e) => updateTeamMember(member.id, { feeAmount: Number(e.target.value) || 0 })}
                                className="pl-9 h-9"
                                min={0}
                              />
                            </div>
                          </div>

                          <div className="w-28 text-right">
                            <p className="text-lg font-bold">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-muted-foreground">Total cost</p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {marketHint && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {marketHint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Team Costs</span>
                <span className="text-lg sm:text-xl font-bold text-destructive">${totalTeamCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <Separator />
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">COST BREAKDOWN</p>

            {(Object.keys(fullCostsByRole) as RoleType[]).map((role) => {
              if (fullCostsByRole[role] === 0) return null;
              const config = roleConfig[role];
              const count = teamMembers.filter(m => m.role === role).length;
              return (
                <div key={role} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    {config.label} ({count})
                  </span>
                  <span className="text-destructive">-${fullCostsByRole[role].toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              );
            })}

            <Separator />

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Your Markup ({markupPercent}%)</span>
              <span className="text-primary font-medium">+${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>

            <Separator />

            <div className="p-3 sm:p-4 rounded-lg bg-primary/10">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm sm:text-lg">YOUR PROFIT</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  ${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Gross Revenue</span>
                <span className="text-base sm:text-lg font-semibold">
                  ${grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </RechartsChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Person Analysis & Payout Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Per-Person Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Cost / Person</p>
                <p className="text-lg sm:text-2xl font-bold text-destructive">${actualCostPerPerson.toFixed(0)}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Markup / Person</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">${markupPerPerson.toFixed(0)}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-primary/10">
                <p className="text-xs sm:text-sm text-muted-foreground">Final Price / Person</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">
                  ${finalPricePerPerson.toFixed(0)}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Breakeven Attendees</p>
                <p className="text-lg sm:text-2xl font-bold">{breakevenAttendees || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Payout Schedule Preview
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Chef & Staff: 100% 7 days before | Others: 50/50 split</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Add team members to see payout schedule</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {teamMembers.map((member) => {
                  const cost = calculateMemberCost(member, finalPricePerPerson);
                  const config = roleConfig[member.role];
                  const isChefOrStaff = member.role === 'chef' || member.role === 'staff';
                  
                  return (
                    <div key={member.id} className="p-2 sm:p-3 rounded-lg bg-muted/50">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                            <span className="font-medium text-xs">{member.name}</span>
                          </div>
                          <span className="font-bold text-sm">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        {isChefOrStaff ? (
                          <p className="text-xs text-primary font-medium">100% payment 7 days before event</p>
                        ) : (
                          <div className="flex gap-4 text-xs">
                            <span className="text-muted-foreground">Deposit: <span className="font-medium text-foreground">${(cost * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                            <span className="text-muted-foreground">Final: <span className="font-medium text-foreground">${(cost * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                          </div>
                        )}
                      </div>
                      
                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                          <span className="font-medium text-sm">{member.name}</span>
                        </div>
                        {isChefOrStaff ? (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-primary font-medium">100% (7 days before)</span>
                            <div className="text-right w-20">
                              <p className="text-muted-foreground text-xs">Total</p>
                              <p className="font-bold">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 text-sm">
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">Deposit</p>
                              <p className="font-medium">${(cost * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">Final</p>
                              <p className="font-medium">${(cost * 0.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">Total</p>
                              <p className="font-bold">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
