"use client";

import { HTMLAttributes, forwardRef } from "react";

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
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-700">{label || `Progress: ${Math.round(percentage)}%`}</span>
            {showLabel && <span className="text-slate-500">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizes[size]}`}>
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
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
                className="absolute top-3 left-1/2 w-full h-1 -translate-x-1/2 z-0"
                style={{ backgroundColor: isCompleted ? "#3b82f6" : "#e2e8f0" }}
              />
            )}
            <div
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${isCompleted
                  ? "bg-blue-600 text-white"
                  : isCurrent
                  ? "bg-blue-600 text-white ring-4 ring-blue-200"
                  : "bg-slate-200 text-slate-500"}`}
            >
              {isCompleted && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!isCompleted && index + 1}
            </div>
            <p className={`mt-2 text-xs text-center transition-colors duration-300 ${
              isCompleted || isCurrent ? "text-blue-600 font-medium" : "text-slate-400"
            }`}>
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}