"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Header } from "../../../components/layout/Header";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

type ResultEntry = {
  id: string;
  filename: string;
  created_at: number;
  size: number;
};

export default function AnalysisListPage() {
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3001/results");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResults(json || []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Failed to load results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const openResult = (id: string) => {
    router.push(`/analysis/result?id=${encodeURIComponent(id)}`);
  };

  const downloadResult = async (id: string, filename: string) => {
    try {
      const res = await fetch(
        `http://localhost:3001/results/${encodeURIComponent(id)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const blob = new Blob([json.content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
      alert("Failed to download result.");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-semibold text-white">
            Results
          </h1>
        </div>

        <Card className="rounded-2xl p-0">
          <div className="space-y-px p-2">
            {loading && (
              <div className="rounded-xl px-4 py-3 text-sm text-slate-300">
                Loading...
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="rounded-xl px-4 py-3 text-sm text-slate-300">
                No results.
              </div>
            )}

            {!loading &&
              !error &&
              results.map((result) => (
                <div
                  key={result.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {result.filename}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(result.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => openResult(result.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="gap-1"
                      onClick={() => downloadResult(result.id, result.filename)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
