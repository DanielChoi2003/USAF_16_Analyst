// Minimal Badge - Error Free
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "high"
    | "medium"
    | "low"
    | "success"
    | "default"
    | "info";
}

export function Badge({ children, variant = "medium" }: BadgeProps) {
  const styles = {
    high: "border border-red-400/20 bg-red-500/15 text-red-200",
    medium: "border border-amber-300/20 bg-amber-400/15 text-amber-100",
    low: "border border-slate-300/15 bg-slate-300/10 text-slate-200",
    success: "border border-emerald-400/20 bg-emerald-400/15 text-emerald-100",
    default: "border border-slate-300/15 bg-slate-200/10 text-slate-200",
    info: "border border-sky-400/20 bg-sky-400/15 text-sky-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}
