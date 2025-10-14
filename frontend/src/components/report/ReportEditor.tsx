/**
 * ReportEditor Component
 *
 * Editable report with AI-generated summary, observations, and recommendations.
 * Includes LLM action buttons (rewrite, expand, adjust tone) with diff view.
 */

"use client";

import { useState } from "react";
import {
  Sparkles,
  RotateCw,
  Maximize2,
  Wand2,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Report } from "@/lib/types";

export interface ReportEditorProps {
  report: Report;
  recommendations?: string[]; // From Package level
  onReportChange?: (report: Report) => void;
}

export function ReportEditor({
  report,
  recommendations = [],
  onReportChange,
}: ReportEditorProps) {
  const [editableSummary, setEditableSummary] = useState(report.summary);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState({ original: "", updated: "" });

  // Mock LLM action - TODO: Connect to actual backend
  const handleLLMAction = (action: string, prompt?: string) => {
    console.log(`LLM Action: ${action}`, prompt);

    // Simulate diff view
    setDiffContent({
      original: editableSummary,
      updated:
        editableSummary + "\n\n[AI-generated content based on " + action + "]",
    });
    setShowDiff(true);
  };

  const handleAcceptDiff = () => {
    setEditableSummary(diffContent.updated);
    onReportChange?.({
      ...report,
      summary: diffContent.updated,
    });
    setShowDiff(false);
  };

  const handleRejectDiff = () => {
    setShowDiff(false);
  };

  return (
    <div className="space-y-4">
      {/* AI Actions Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-600" />
            <span className="text-sm font-medium text-slate-700">
              AI Actions
            </span>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Tooltip content="Regenerate with custom prompt">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setIsRegenerateModalOpen(true)}
                >
                  <RotateCw className="w-3 h-3 mr-1.5" />
                  Regenerate
                </Button>
              </Tooltip>

              <Tooltip content="Expand with more detail">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleLLMAction("expand")}
                >
                  <Maximize2 className="w-3 h-3 mr-1.5" />
                  Expand
                </Button>
              </Tooltip>

              <Tooltip content="Adjust tone (formal/technical)">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleLLMAction("adjust_tone")}
                >
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  Adjust Tone
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Executive Summary</CardTitle>
            <Badge variant={report.confidence.toLowerCase() as any}>
              {report.confidence} Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={editableSummary}
            onChange={(e) => setEditableSummary(e.target.value)}
            onBlur={() =>
              onReportChange?.({
                ...report,
                summary: editableSummary,
              })
            }
            className="w-full min-h-[200px] p-3 text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-y"
            placeholder="Enter executive summary..."
          />
        </CardContent>
      </Card>

      {/* Observations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.observations.map((obs, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{obs.text}</p>
                  {obs.evidence_event_ids.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Evidence: {obs.evidence_event_ids.length} event
                      {obs.evidence_event_ids.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-accent-600 font-bold">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Modal */}
      <Modal
        open={isRegenerateModalOpen}
        onOpenChange={setIsRegenerateModalOpen}
        title="Regenerate Report"
        description="Provide specific instructions for the AI to regenerate the report."
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            value={regeneratePrompt}
            onChange={(e) => setRegeneratePrompt(e.target.value)}
            placeholder="e.g., 'Focus more on lateral movement techniques' or 'Make it less technical for executive audience'"
            className="w-full min-h-[120px] p-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-y"
          />
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRegenerateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              handleLLMAction("regenerate", regeneratePrompt);
              setIsRegenerateModalOpen(false);
              setRegeneratePrompt("");
            }}
            disabled={!regeneratePrompt.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </ModalFooter>
      </Modal>

      {/* Diff Modal */}
      <Modal
        open={showDiff}
        onOpenChange={setShowDiff}
        title="Review Changes"
        description="Compare the original and AI-generated versions."
        size="xl"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Original
            </h4>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {diffContent.original}
            </pre>
          </div>

          {/* Updated */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-600" />
              AI-Generated
            </h4>
            <pre className="p-3 bg-green-50 border border-green-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {diffContent.updated}
            </pre>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={handleRejectDiff}>
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button variant="primary" size="sm" onClick={handleAcceptDiff}>
            <Check className="w-4 h-4 mr-2" />
            Accept Changes
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
