"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "jade" | "marigold" | "rani";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-card transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none font-body select-none";

    const variants = {
      primary: "bg-marigold text-ink-2 hover:bg-marigold-hover shadow-sm hover:shadow focus-visible:ring-marigold",
      marigold: "bg-marigold text-ink-2 hover:bg-marigold-hover shadow-sm hover:shadow focus-visible:ring-marigold",
      jade: "bg-jade text-white hover:bg-jade-hover shadow-sm hover:shadow focus-visible:ring-jade",
      rani: "bg-rani text-white hover:bg-[#9E2E27] shadow-sm hover:shadow focus-visible:ring-rani",
      secondary: "bg-paper-card text-text border border-line hover:border-line-strong hover:bg-paper focus-visible:ring-jade",
      outline: "border-1.5 border-line hover:border-text-muted text-text bg-transparent hover:bg-paper-card focus-visible:ring-jade",
      ghost: "text-text-muted hover:text-text hover:bg-paper-subtle focus-visible:ring-jade",
      danger: "bg-rani text-white hover:bg-[#9E2E27] shadow-sm hover:shadow focus-visible:ring-rani"
    };

    const sizes = {
      sm: "px-3.5 py-1.5 text-sm gap-2",
      md: "px-5 py-2.5 text-base gap-2.5",
      lg: "px-7 py-3.5 text-lg gap-3"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin h-4 w-4 shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
