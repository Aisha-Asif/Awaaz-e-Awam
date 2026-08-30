"use client";

import { useCallback } from "react";
import { Progress } from "./Progress";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  showLabel?: boolean;
}

export const ProgressIndicator = ({
  currentStep,
  totalSteps,
  stepLabels,
  showLabel = true
}: ProgressIndicatorProps) => {
  return (
    <Progress
      value={currentStep}
      max={totalSteps}
      showLabel={showLabel}
      label={showLabel ? `${currentStep} of ${totalSteps} complete` : undefined}
      size="lg"
    />
  );
};

ProgressIndicator.displayName = "ProgressIndicator";