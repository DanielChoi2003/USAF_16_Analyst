"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../../components/layout/Header";
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
      } catch (e) {
        console.error(e);
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
      const res = await fetch(`http://localhost:3001/results/${encodeURIComponent(id)}`);
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
+      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to download result.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-sm text-gray-600 mt-2">Previously generated analyses.</p>
        </div>

        <Card>
          <div className="p-6">
            {loading && <div className="text-center p-4">Loading...</div>}
            {error && <div className="text-center p-4 text-red-600">{error}</div>}

            {!loading && !error && (
              <div className="space-y-3">
                {results.length === 0 && (
                  <div className="text-center text-gray-600 p-6">No results yet.</div>
                )}
                {results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{r.filename}</div>
                      <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openResult(r.id)} className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700">View</button>
                      <button onClick={() => downloadResult(r.id, r.filename)} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
