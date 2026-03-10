import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface LookingFor {
  needs?: string[];
  staffDayRate?: number;
  chefDayRate?: number;
  cohostFeePerPerson?: number;
  cohostFeeType?: string;
  cohostPercentage?: number;
  venueBudgetPerPersonPerNight?: number;
  nights?: number;
}

interface ApplyToRetreatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatId: string;
  retreatTitle: string;
  lookingFor: LookingFor;
  onApplied: () => void;
}

const roleLabels: Record<string, string> = {
  cohost: 'Co-Host',
  venue: 'Venue / Property',
  chef: 'Chef / Catering',
  staff: 'Support Staff',
};

const roleFeeTypes: Record<string, string> = {
  cohost: 'per_person',
  venue: 'per_person_per_night',
  chef: 'per_night',
  staff: 'per_night',
};

function getDefaultFee(role: string, lookingFor: LookingFor): number {
  switch (role) {
    case 'cohost': return lookingFor.cohostFeePerPerson || 0;
    case 'venue': return lookingFor.venueBudgetPerPersonPerNight || 0;
    case 'chef': return lookingFor.chefDayRate || 0;
    case 'staff': return lookingFor.staffDayRate || 0;
    default: return 0;
  }
}

function getFeeLabel(feeType: string): string {
  switch (feeType) {
    case 'per_person': return '/ person';
    case 'per_night': return '/ night';
    case 'per_person_per_night': return '/ person / night';
    case 'flat': return 'flat';
    case 'percentage': return '%';
    default: return '';
  }
}

export function ApplyToRetreatDialog({
  open,
  onOpenChange,
  retreatId,
  retreatTitle,
  lookingFor,
  onApplied,
}: ApplyToRetreatDialogProps) {
  const { user } = useAuth();
  const availableRoles = (lookingFor.needs || []).filter(n => n in roleLabels);
  const [selectedRole, setSelectedRole] = useState(availableRoles[0] || '');
  const [feeAmount, setFeeAmount] = useState(getDefaultFee(availableRoles[0] || '', lookingFor));
  const [feeType, setFeeType] = useState(roleFeeTypes[availableRoles[0] || ''] || 'flat');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form state when dialog opens or retreat changes
  useEffect(() => {
    if (open) {
      const roles = (lookingFor.needs || []).filter(n => n in roleLabels);
      const firstRole = roles[0] || '';
      setSelectedRole(firstRole);
      setFeeAmount(getDefaultFee(firstRole, lookingFor));
      setFeeType(roleFeeTypes[firstRole] || 'flat');
      setDescription('');
    }
  }, [open, retreatId]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setFeeAmount(getDefaultFee(role, lookingFor));
    setFeeType(roleFeeTypes[role] || 'flat');
  };

  const handleSubmit = async () => {
    if (!user || !selectedRole) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('retreat_team')
        .insert({
          retreat_id: retreatId,
          user_id: user.id,
          role: selectedRole as 'host' | 'cohost' | 'venue' | 'chef' | 'staff' | 'other',
          fee_amount: feeAmount,
          fee_type: feeType,
          description: description || null,
          agreed: false,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied for this role on this retreat.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Application submitted!', {
        description: 'The host will review your application.',
      });
      onApplied();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Apply to Join</DialogTitle>
          <DialogDescription>
            Apply to work on "{retreatTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            {availableRoles.length === 1 ? (
              <p className="text-sm font-medium text-foreground">{roleLabels[availableRoles[0]]}</p>
            ) : (
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Your Rate (${getFeeLabel(feeType)})</Label>
            <Input
              type="number"
              min={0}
              value={feeAmount}
              onChange={e => setFeeAmount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Suggested: ${getDefaultFee(selectedRole, lookingFor)} {getFeeLabel(feeType)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Tell the host about your experience and why you'd be a good fit..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedRole}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
