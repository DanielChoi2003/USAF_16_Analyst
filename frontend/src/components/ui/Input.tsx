/**
 * Input Component
 *
 * Text input field with validation states, icons, and Air Force styling.
 * Used for search, filters, report editing, etc.
 */

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth, icon, className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={cn("flex flex-col gap-1", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && <span className="ml-1 text-danger-600">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900",
              "placeholder:text-slate-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500",
              "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
              {
                "border-slate-300": !hasError,
                "border-danger-600 focus:ring-danger-500 focus:border-danger-500":
                  hasError,
                "pl-10": !!icon,
              },
              className
            )}
            {...props}
          />
        </div>

        {(error || helperText) && (
          <p
            className={cn("text-xs", {
              "text-danger-600": hasError,
              "text-slate-500": !hasError,
            })}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
