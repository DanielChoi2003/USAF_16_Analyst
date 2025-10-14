/**
 * MISPMatchRow Component
 *
 * Individual MISP threat intel match showing IOC, tags, confidence, and link.
 * Displays related MITRE techniques and actors.
 */

"use client";

import { ExternalLink, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import type { MISPMatch } from "@/lib/types";

export interface MISPMatchRowProps {
  match: MISPMatch;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function MISPMatchRow({
  match,
  isHighlighted,
  onClick,
}: MISPMatchRowProps) {
  // Determine IOC type icon/color
  const getIOCTypeConfig = (type: string) => {
    switch (type) {
      case "hash":
        return { variant: "file" as const, label: "Hash" };
      case "ip":
        return { variant: "ip" as const, label: "IP" };
      case "domain":
        return { variant: "default" as const, label: "Domain" };
      case "filename":
        return { variant: "file" as const, label: "File" };
      default:
        return { variant: "default" as const, label: type };
    }
  };

  const iocConfig = getIOCTypeConfig(match.type);

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-md bg-white border transition-all cursor-pointer",
        "hover:shadow-sm",
        isHighlighted && "border-yellow-400 bg-yellow-50",
        !isHighlighted && "border-slate-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Chip variant={iocConfig.variant} className="text-xs">
              {iocConfig.label}
            </Chip>
            <Badge variant={match.confidence.toLowerCase() as any}>
              {match.confidence}
            </Badge>
          </div>
          <p
            className="text-xs font-mono text-slate-700 truncate"
            title={match.ioc}
          >
            {match.ioc}
          </p>
        </div>

        {/* External Link */}
        {match.reference && (
          <a
            href={match.reference}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 ml-2 text-accent-600 hover:text-accent-700"
            aria-label="View MISP Event"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* MISP Event Title */}
      <h4 className="text-sm font-medium text-slate-900 mb-2">
        {match.misp_event_title}
      </h4>

      {/* Tags */}
      {match.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {match.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Techniques */}
      {match.related_techniques.length > 0 && (
        <div className="text-xs text-slate-600 mb-1">
          <span className="font-medium">Techniques:</span>{" "}
          {match.related_techniques.map((tech, idx) => (
            <span key={idx}>
              <span className="font-mono text-accent-700">{tech}</span>
              {idx < match.related_techniques.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}

      {/* Related Actors */}
      {match.related_actors.length > 0 && (
        <div className="text-xs text-slate-600 flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 text-danger-600 flex-shrink-0" />
          <div>
            <span className="font-medium">Actors:</span>{" "}
            {match.related_actors.join(", ")}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>
            {match.evidence_event_ids.length} related event
            {match.evidence_event_ids.length !== 1 ? "s" : ""}
          </span>
          <span>Source: {match.source}</span>
        </div>
      </div>
    </div>
  );
}
