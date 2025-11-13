/**
 * Chip Component (Entity Badge)
 *
 * Small pill-shaped badges for entities like hosts, IPs, users, filenames.
 * Displays icon + text, clickable for filtering/selection.
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "default" | "host" | "ip" | "user" | "file" | "process";
  removable?: boolean;
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      icon,
      variant = "default",
      removable,
      onRemove,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          {
            // Default (slate)
            "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400":
              variant === "default",

            // Host (blue)
            "bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-400":
              variant === "host",

            // IP (purple)
            "bg-purple-50 text-purple-700 hover:bg-purple-100 focus:ring-purple-400":
              variant === "ip",

            // User (green)
            "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-400":
              variant === "user",

            // File (amber)
            "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-400":
              variant === "file",

            // Process (cyan)
            "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 focus:ring-cyan-400":
              variant === "process",
          },
          props.disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="flex-shrink-0 hover:opacity-70 ml-0.5"
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = "Chip";
