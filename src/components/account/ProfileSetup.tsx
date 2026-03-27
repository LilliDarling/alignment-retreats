"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import BasicInfoForm from "@/components/account/sections/BasicInfoForm";
import ProfessionalForm from "@/components/account/sections/ProfessionalForm";
import AboutForm from "@/components/account/sections/AboutForm";
import SocialLinksForm from "@/components/account/sections/SocialLinksForm";
import PortfolioForm from "@/components/account/sections/PortfolioForm";
import { markProfileComplete } from "@/lib/actions/profile";
import type { EditableProfile } from "@/types/profile";

const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "about", label: "About You" },
  { key: "professional", label: "Professional" },
  { key: "social", label: "Social Links" },
  { key: "portfolio", label: "Portfolio" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface ProfileSetupProps {
  profile: EditableProfile;
}

export default function ProfileSetup({ profile: initialProfile }: ProfileSetupProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const [completing, setCompleting] = useState(false);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const goBack = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const goForward = () => {
    if (!isLast) setCurrentStep((s) => s + 1);
  };

  const handleStepSaved = () => {
    // Refresh profile data would be ideal, but for the wizard we just advance
    if (isLast) {
      handleComplete();
    } else {
      goForward();
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    await markProfileComplete();
    router.push("/account");
  };

  const handleSkip = () => {
    if (isLast) {
      handleComplete();
    } else {
      goForward();
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-foreground mb-2">Complete Your Profile</h1>
        <p className="text-sm text-muted-foreground">
          Fill in your details to get the most out of Alignment Retreats. You can skip any section and come back later.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => jumpToStep(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {i < currentStep && <Check className="w-3 h-3" />}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Current Step Form */}
      <div className="bg-white rounded-[16px] border border-border p-5 sm:p-6 mb-6">
        <h2 className="text-lg font-display text-foreground mb-4">{step.label}</h2>

        {step.key === "basic" && (
          <BasicInfoForm profile={profile} onSaved={handleStepSaved} onCancel={goBack} />
        )}
        {step.key === "about" && (
          <AboutForm profile={profile} onSaved={handleStepSaved} onCancel={goBack} />
        )}
        {step.key === "professional" && (
          <ProfessionalForm profile={profile} onSaved={handleStepSaved} onCancel={goBack} />
        )}
        {step.key === "social" && (
          <SocialLinksForm profile={profile} onSaved={handleStepSaved} onCancel={goBack} />
        )}
        {step.key === "portfolio" && (
          <PortfolioForm profile={profile} onSaved={handleStepSaved} onCancel={goBack} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirst}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isLast ? "Finish without saving" : "Skip this step"}
        </button>

        <button
          type="button"
          onClick={goForward}
          disabled={isLast}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
