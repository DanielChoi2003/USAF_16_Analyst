"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, Download, FileText, Shield } from "lucide-react";
import { Header } from "../../../components/layout/Header";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";

type SectionKey =
  | "summary"
  | "keyFindings"
  | "mitreAttackAssessment"
  | "recommendedActions";

type ParsedAnalysis = {
  sections: Record<SectionKey, string>;
  raw: string;
};

const SECTION_ORDER: SectionKey[] = [
  "summary",
  "keyFindings",
  "mitreAttackAssessment",
  "recommendedActions",
];

function normalizeSectionKey(value: string): SectionKey | null {
  const compact = value.toLowerCase().replace(/[^a-z&]/g, "");

  if (compact === "summary") return "summary";
  if (compact === "keyfindings") return "keyFindings";
  if (compact === "mitreatt&ckassessment" || compact === "mitreattckassessment") {
    return "mitreAttackAssessment";
  }
  if (
    compact === "recommendedactions" ||
    compact === "recommendations"
  ) {
    return "recommendedActions";
  }

  return null;
}

function parseAnalysisResult(input: string): ParsedAnalysis {
  const sections: Record<SectionKey, string> = {
    summary: "",
    keyFindings: "",
    mitreAttackAssessment: "",
    recommendedActions: "",
  };

  const headingRegex =
    /^(?:#{1,6}\s*)?(Summary|Key Findings|MITRE ATT&CK Assessment|MITRE ATTCK Assessment|Recommended Actions|Recommendations)\s*:?\s*$/gim;
  const matches = Array.from(input.matchAll(headingRegex));

  if (matches.length === 0) {
    return { sections, raw: input.trim() };
  }

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]!;
    const sectionKey = normalizeSectionKey(match[1] || "");
    if (!sectionKey || match.index === undefined) continue;

    const contentStart = match.index + match[0].length;
    const nextMatch = matches[i + 1];
    const contentEnd =
      nextMatch && nextMatch.index !== undefined
        ? nextMatch.index
        : input.length;

    sections[sectionKey] = input.slice(contentStart, contentEnd).trim();
  }

  return { sections, raw: input.trim() };
}

function splitBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim());
}

export default function AnalysisResultPage() {
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams ? searchParams.get("id") : null;

  useEffect(() => {
    const fetchOrLoad = async () => {
      try {
        if (id) {
          const res = await fetch(
            `http://localhost:3001/results/${encodeURIComponent(id)}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          setResult(json.content || null);
          return;
        }

        const stored = sessionStorage.getItem("analysisResult");
        setResult(stored || null);
      } catch (fetchError) {
        console.warn("Unable to load analysis result", fetchError);
        setResult(null);
      }
    };

    fetchOrLoad();
  }, [id]);

  const handleBack = () => {
    router.push("/upload");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_result.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const parsed = result ? parseAnalysisResult(result) : null;
  const hasStructuredSections = parsed
    ? SECTION_ORDER.some((key) => parsed.sections[key])
    : false;
  const recommendations = parsed
    ? splitBullets(parsed.sections.recommendedActions)
    : [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">
            Result
          </h1>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleDownload}
              disabled={!result}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl p-4">
          {result && parsed ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                <Badge variant="info">Analyst Report</Badge>
                {recommendations.length > 0 && (
                  <Badge variant="success">{recommendations.length} Actions</Badge>
                )}
                {!hasStructuredSections && (
                  <Badge variant="medium">Raw Format</Badge>
                )}
              </div>

              {hasStructuredSections ? (
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <section className="rounded-2xl border border-white/10 bg-[#060b14] p-5">
                      <div className="mb-3 flex items-center gap-2 text-slate-100">
                        <FileText className="h-4 w-4 text-sky-200" />
                        <h2 className="font-display text-lg font-semibold">
                          Summary
                        </h2>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                        {parsed.sections.summary || "No summary was returned."}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#060b14] p-5">
                      <div className="mb-3 flex items-center gap-2 text-slate-100">
                        <AlertTriangle className="h-4 w-4 text-amber-200" />
                        <h2 className="font-display text-lg font-semibold">
                          Key Findings
                        </h2>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-200">
                        {splitBullets(parsed.sections.keyFindings).map((item) => (
                          <li
                            key={item}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-6"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="space-y-4">
                    <section className="rounded-2xl border border-white/10 bg-[#060b14] p-5">
                      <div className="mb-3 flex items-center gap-2 text-slate-100">
                        <Shield className="h-4 w-4 text-emerald-200" />
                        <h2 className="font-display text-lg font-semibold">
                          Recommended Actions
                        </h2>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-200">
                        {recommendations.length > 0 ? (
                          recommendations.map((item) => (
                            <li
                              key={item}
                              className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 leading-6"
                            >
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-6">
                            No recommendations were returned.
                          </li>
                        )}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#060b14] p-5">
                      <div className="mb-3 flex items-center gap-2 text-slate-100">
                        <Shield className="h-4 w-4 text-fuchsia-200" />
                        <h2 className="font-display text-lg font-semibold">
                          MITRE ATT&CK Assessment
                        </h2>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-200">
                        {splitBullets(parsed.sections.mitreAttackAssessment).map((item) => (
                          <li
                            key={item}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-6"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#060b14] p-4 text-sm leading-7 text-slate-200">
                  <code>{parsed.raw}</code>
                </pre>
              )}

              <details className="rounded-xl border border-white/10 bg-black/10 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-200">
                  View raw output
                </summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  <code>{parsed.raw}</code>
                </pre>
              </details>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
              No analysis result found.
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
