import { useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BuildRetreatWizard } from './BuildRetreatWizard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BuildRetreatDialogProps {
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BuildRetreatDialog({ 
  children, 
  defaultOpen = false,
  onOpenChange 
}: BuildRetreatDialogProps) {
  const [open, setOpen] = useState(defaultOpen);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <BuildRetreatWizard 
            onClose={() => handleOpenChange(false)}
            onSuccess={() => handleOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
