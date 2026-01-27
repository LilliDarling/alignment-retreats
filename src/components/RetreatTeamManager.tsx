import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Home, 
  Handshake, 
  ChefHat, 
  Users,
  DollarSign,
  Calculator
} from 'lucide-react';

interface TeamMember {
  id?: string;
  user_id: string;
  role: 'venue' | 'cohost' | 'chef' | 'staff' | 'other';
  fee_type: 'flat' | 'per_person' | 'per_night' | 'per_person_per_night' | 'percentage';
  fee_amount: number;
  description?: string;
  name?: string;
}

interface RetreatTeamManagerProps {
  retreatId?: string;
  pricePerPerson: number;
  maxAttendees: number;
  numNights: number;
  onTeamChange?: (team: TeamMember[], totalCost: number) => void;
}

const roleIcons = {
  venue: Home,
  cohost: Handshake,
  chef: ChefHat,
  staff: Users,
  other: Users,
};

const roleLabels = {
  venue: 'Venue',
  cohost: 'Co-host',
  chef: 'Chef',
  staff: 'Staff',
  other: 'Other',
};

const feeTypeLabels = {
  flat: 'Flat Fee',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_person_per_night: 'Per Person/Night',
  percentage: 'Percentage of Total',
};

export function RetreatTeamManager({ 
  retreatId, 
  pricePerPerson, 
  maxAttendees, 
  numNights,
  onTeamChange 
}: RetreatTeamManagerProps) {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; role: string }[]>([]);

  const calculateMemberFee = (member: TeamMember): number => {
    switch (member.fee_type) {
      case 'flat':
        return member.fee_amount;
      case 'per_person':
        return member.fee_amount * maxAttendees;
      case 'per_night':
        return member.fee_amount * numNights;
      case 'per_person_per_night':
        return member.fee_amount * maxAttendees * numNights;
      case 'percentage':
        return (member.fee_amount / 100) * pricePerPerson * maxAttendees;
      default:
        return 0;
    }
  };

  const totalTeamCost = teamMembers.reduce((sum, member) => sum + calculateMemberFee(member), 0);
  const totalRevenue = pricePerPerson * maxAttendees;
  const platformFee = totalRevenue * 0.30; // 30% platform fee
  const hostProfit = totalRevenue - totalTeamCost - platformFee;

  useEffect(() => {
    if (onTeamChange) {
      onTeamChange(teamMembers, totalTeamCost);
    }
  }, [teamMembers, totalTeamCost]);

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      {
        user_id: '',
        role: 'staff',
        fee_type: 'flat',
        fee_amount: 0,
        description: '',
      },
    ]);
  };

  const updateTeamMember = (index: number, updates: Partial<TeamMember>) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], ...updates };
    setTeamMembers(updated);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const searchUsers = async (query: string, role: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      let tableName = 'profiles';
      if (role === 'venue') tableName = 'properties';
      else if (role === 'cohost') tableName = 'cohosts';
      else if (role === 'staff' || role === 'chef') tableName = 'staff_profiles';

      // For now, search profiles - in production you'd search specific role tables
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (data) {
        setSearchResults(data.map(p => ({ id: p.id, name: p.name || 'Unknown', role })));
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Calculator Summary */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-semibold text-foreground">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Team Costs</p>
              <p className="text-xl font-semibold text-destructive">
                -${totalTeamCost.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform Fee (30%)</p>
              <p className="text-xl font-semibold text-muted-foreground">
                -${platformFee.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Profit</p>
              <p className={`text-xl font-semibold ${hostProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                ${hostProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Team Members</h3>
          <Button variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {teamMembers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold text-foreground mb-2">No team members yet</h4>
              <p className="text-muted-foreground text-sm mb-4">
                Add venues, co-hosts, chefs, or staff to your retreat team
              </p>
              <Button variant="outline" onClick={addTeamMember}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member, index) => {
              const Icon = roleIcons[member.role];
              const memberFee = calculateMemberFee(member);
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select 
                            value={member.role} 
                            onValueChange={(v) => updateTeamMember(index, { role: v as TeamMember['role'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Fee Type</Label>
                          <Select 
                            value={member.fee_type} 
                            onValueChange={(v) => updateTeamMember(index, { fee_type: v as TeamMember['fee_type'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(feeTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {member.fee_type === 'percentage' ? 'Percentage' : 'Amount ($)'}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step={member.fee_type === 'percentage' ? '0.1' : '1'}
                            value={member.fee_amount}
                            onChange={(e) => updateTeamMember(index, { fee_amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="e.g., Venue rental"
                            value={member.description || ''}
                            onChange={(e) => updateTeamMember(index, { description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {memberFee.toLocaleString()}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeTeamMember(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout Schedule Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Payout Schedule</h4>
              <p className="text-sm text-muted-foreground">
                Team members will receive <strong>50% as a deposit</strong> immediately after a booking is confirmed, 
                and the remaining <strong>50% one week before</strong> the retreat starts. 
                All team members must have a connected Stripe account to receive payouts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
