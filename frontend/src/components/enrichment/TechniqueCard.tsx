/**
 * TechniqueCard Component
 *
 * MITRE ATT&CK technique card showing ID, name, confidence, and expandable details.
 * Clickable to highlight related events and show full MITRE description.
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { AttackCandidate } from "@/lib/types";

export interface TechniqueCardProps {
  technique: AttackCandidate;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TechniqueCard({
  technique,
  isSelected,
  onClick,
}: TechniqueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Convert confidence score to badge variant
  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return { variant: "high" as const, label: "High" };
    if (score >= 0.5) return { variant: "medium" as const, label: "Medium" };
    return { variant: "low" as const, label: "Low" };
  };

  const confidenceBadge = getConfidenceBadge(technique.confidence);

  return (
    <div
      onClick={onClick}
      className={cn(
        "border-l-4 rounded-md bg-white transition-all cursor-pointer",
        "hover:shadow-sm",
        isSelected && "border-accent-500 shadow-md ring-2 ring-accent-200",
        !isSelected && "border-transparent"
      )}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-2">
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
            {/* Technique ID & Tactic */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-accent-700">
                {technique.technique_id}
              </span>
              <Badge variant="default">{technique.tactic}</Badge>
            </div>

            {/* Technique Name */}
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {technique.technique_name}
            </h3>

            {/* Confidence & Evidence Count */}
            <div className="flex items-center justify-between">
              <Badge variant={confidenceBadge.variant}>
                {confidenceBadge.label} (
                {Math.round(technique.confidence * 100)}%)
              </Badge>
              <span className="text-xs text-slate-500">
                {technique.evidence_event_ids.length} event
                {technique.evidence_event_ids.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pl-6 space-y-3 text-sm">
            {/* Rationale */}
            <div>
              <h4 className="font-medium text-slate-700 mb-1">Rationale</h4>
              <p className="text-slate-600">{technique.rationale}</p>
            </div>

            {/* MITRE Description */}
            {technique.mitre_description && (
              <div>
                <h4 className="font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  MITRE Description
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {technique.mitre_description}
                </p>
              </div>
            )}

            {/* MITRE Detection */}
            {technique.mitre_detection && (
              <div>
                <h4 className="font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Detection
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {technique.mitre_detection}
                </p>
              </div>
            )}

            {/* MITRE Mitigation */}
            {technique.mitre_mitigation && (
              <div>
                <h4 className="font-medium text-slate-700 mb-1">Mitigation</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {technique.mitre_mitigation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
