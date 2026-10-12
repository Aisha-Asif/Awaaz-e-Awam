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
      lg: "h-4",
    };

    return (
      <div ref={ref} className={className} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between text-xs sm:text-sm mb-2 font-medium font-body">
            <span className="text-text">{label || `Progress: ${Math.round(percentage)}%`}</span>
            {showLabel && <span className="text-text-muted font-mono">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div
          className={`w-full bg-paper-subtle border border-line/60 rounded-full overflow-hidden p-0.5 ${sizes[size]}`}
        >
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
  },
);

Progress.displayName = "Progress";
