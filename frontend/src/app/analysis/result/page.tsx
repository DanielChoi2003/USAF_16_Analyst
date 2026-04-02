"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";
import { Header } from "../../../components/layout/Header";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

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
    const blob = new Blob([result], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_result.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
          {result ? (
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#060b14] p-4 text-sm leading-7 text-slate-200">
              <code>{result}</code>
            </pre>
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
