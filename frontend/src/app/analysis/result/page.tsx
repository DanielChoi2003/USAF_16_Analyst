"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../../../components/layout/Header";
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
          // fetch from backend by id
          const res = await fetch(`http://localhost:3001/results/${encodeURIComponent(id)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          setResult(json.content || null);
          return;
        }

        const stored = sessionStorage.getItem("analysisResult");
        if (stored) {
          setResult(stored);
        } else {
          setResult(null);
        }
      } catch (e) {
        console.warn("Unable to load analysis result", e);
        setResult(null);
      }
    };

    fetchOrLoad();
  }, []);

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
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Result</h1>
          <p className="text-sm text-gray-600 mt-2">
            This page shows the parsed response from the RAG analysis.
          </p>
        </div>

        <Card>
          <div className="p-6">
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
                disabled={!result}
              >
                Download JSON
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-800 py-1 px-3 rounded hover:bg-gray-300"
              >
                Back to Upload
              </button>
            </div>

            {result ? (
              <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                <code>{result}</code>
              </pre>
            ) : (
              <div className="text-center p-8 text-gray-600">
                No analysis result found. Please run an analysis from the Upload
                page.
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
