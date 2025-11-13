/**
 * Modal Component (Dialog)
 *
 * Accessible modal dialog built on Radix UI primitives.
 * Used for LLM actions, export options, provenance display, etc.
 */

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in-0 z-50" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "bg-white rounded-lg shadow-lg",
            "animate-in fade-in-0 slide-in-from-bottom-4",
            "max-h-[90vh] overflow-y-auto",
            {
              "w-full max-w-sm": size === "sm",
              "w-full max-w-md": size === "md",
              "w-full max-w-2xl": size === "lg",
              "w-full max-w-4xl": size === "xl",
              "w-[95vw] h-[95vh]": size === "full",
            },
            className
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="border-b border-slate-200 p-6 pb-4">
              {title && (
                <Dialog.Title className="text-xl font-bold text-navy-900">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-2 text-sm text-slate-600">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>

          {/* Close button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent-500">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Modal Footer (for action buttons)
 */
export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-slate-200 p-6 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
