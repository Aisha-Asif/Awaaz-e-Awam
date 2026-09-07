import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    const variants = {
      default: "bg-paper-card shadow-[0_2px_8px_rgba(15,36,32,0.04)] border border-line",
      elevated: "bg-paper-card shadow-[0_8px_24px_rgba(15,36,32,0.06)] border border-line",
      outlined: "bg-paper-card border border-line-strong"
    };

    const paddings = {
      none: "",
      sm: "p-4 sm:p-5",
      md: "p-5 sm:p-7",
      lg: "p-6 sm:p-9"
    };

    return (
      <div
        ref={ref}
        className={`rounded-card ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>{children}</div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => (
    <h3 ref={ref} className={`text-xl font-semibold font-display text-text ${className}`} {...props}>{children}</h3>
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", children, ...props }, ref) => (
    <p ref={ref} className={`text-text-muted mt-1 ${className}`} {...props}>{children}</p>
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>{children}</div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`mt-4 flex items-center gap-3 ${className}`} {...props}>{children}</div>
  )
);
CardFooter.displayName = "CardFooter";
