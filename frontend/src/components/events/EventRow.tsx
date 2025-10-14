/**
 * EventRow Component
 *
 * Individual event row showing timestamp, host, subtype, and expandable raw data.
 * Clickable to select/highlight related enrichments.
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import type { Event } from "@/lib/types";

export interface EventRowProps {
  event: Event;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function EventRow({
  event,
  isSelected,
  isHighlighted,
  onClick,
}: EventRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "border-l-4 rounded-md bg-white transition-all cursor-pointer",
        "hover:shadow-sm",
        isSelected && "border-accent-500 shadow-md ring-2 ring-accent-200",
        isHighlighted && !isSelected && "border-yellow-400 bg-yellow-50",
        !isSelected && !isHighlighted && "border-transparent"
      )}
    >
      {/* Main Content */}
      <div className="p-3">
        {/* Header Row */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={handleToggle}
            className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-slate-600"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
              <Calendar className="w-3 h-3" />
              <span className="font-mono">
                {new Date(event.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Host & Subtype */}
            <div className="flex flex-wrap items-center gap-2">
              {event.host && (
                <Chip icon={<Server className="w-3 h-3" />} variant="host">
                  {event.host.name}
                </Chip>
              )}
              <span className="text-xs font-medium text-slate-700">
                {event.subtype}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Raw Excerpt */}
        {isExpanded && event.raw_excerpt && (
          <div className="mt-2 pl-6">
            <pre className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {event.raw_excerpt}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
