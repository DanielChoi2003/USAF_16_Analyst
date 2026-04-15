// Minimal Button - Error Free
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-full border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300/70 disabled:cursor-not-allowed disabled:opacity-60";
    const variantStyles = {
      primary:
        "border-accent-400/40 bg-accent-500 text-white shadow-[0_12px_30px_rgba(10,99,216,0.35)] hover:-translate-y-0.5 hover:bg-accent-400",
      secondary:
        "border-white/10 bg-white/8 text-slate-100 hover:border-white/20 hover:bg-white/12",
      ghost:
        "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
    };
    const sizeStyles = {
      xs: "px-3 py-1.5 text-xs",
      sm: "px-3.5 py-2 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
