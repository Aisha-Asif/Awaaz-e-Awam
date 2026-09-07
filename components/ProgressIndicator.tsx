"use client";

import { Progress, StepProgress } from "./Progress";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showLabel?: boolean;
  className?: string;
}

export const ProgressIndicator = ({
  currentStep,
  totalSteps,
  stepLabels,
  showLabel = true,
  className = "",
}: ProgressIndicatorProps) => {
  if (stepLabels && stepLabels.length > 0) {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        <StepProgress
          steps={stepLabels}
          currentStep={currentStep}
        />
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Progress
        value={currentStep}
        max={totalSteps}
        showLabel={showLabel}
        label={showLabel ? `${currentStep} of ${totalSteps} answered` : undefined}
        size="lg"
      />
    </div>
  );
};

ProgressIndicator.displayName = "ProgressIndicator";