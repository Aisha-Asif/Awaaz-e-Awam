"use client";

import { HTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, size = "md", showLabel = false, label, className = "", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4"
    };

    return (
      <div ref={ref} className={className} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between text-xs sm:text-sm mb-2 font-medium font-body">
            <span className="text-text">{label || `Progress: ${Math.round(percentage)}%`}</span>
            {showLabel && <span className="text-text-muted font-mono">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div className={`w-full bg-paper-subtle border border-line/60 rounded-full overflow-hidden p-0.5 ${sizes[size]}`}>
          <div
            className="h-full bg-jade rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || "Progress"}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export function StepProgress({ steps, currentStep, completedSteps = [], className = "" }: StepProgressProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index) || index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {!isLast && (
              <div
                className="absolute top-3.5 left-1/2 w-full h-[2px] -translate-x-1/2 z-0"
                style={{ backgroundColor: isCompleted ? "#1E6B4F" : "#E3DAC5" }}
              />
            )}
            <div
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-body transition-all duration-300
                ${isCompleted
                  ? "bg-jade text-white shadow-sm"
                  : isCurrent
                  ? "bg-ink text-on-ink ring-4 ring-marigold/30"
                  : "bg-paper-card border border-line text-text-muted"}`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                index + 1
              )}
            </div>
            <p className={`mt-2 text-[11px] sm:text-xs text-center transition-colors duration-300 font-body ${
              isCompleted || isCurrent ? "text-ink font-semibold" : "text-text-muted"
            }`}>
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}
