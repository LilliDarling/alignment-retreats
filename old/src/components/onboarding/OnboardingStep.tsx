import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface OnboardingStepProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  icon?: ReactNode;
}

export function OnboardingStep({
  title,
  description,
  currentStep,
  totalSteps,
  children,
  icon,
}: OnboardingStepProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="text-center mb-8">
        {icon && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        )}
      </div>

      <div className="space-y-6">{children}</div>
    </motion.div>
  );
}
