// Minimal Badge - Error Free
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "high" | "medium" | "low";
}

export function Badge({ children, variant = "medium" }: BadgeProps) {
  const styles = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
