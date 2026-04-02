"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Download, FileJson2, Sparkles, UploadCloud } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type ResultEntry = {
  id: string;
  filename: string;
  created_at: number;
  size: number;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
    onDropRejected: () => {
      setError("Invalid file type. Please upload a .json file.");
      setFile(null);
    },
  });

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file to analyze.");
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setIsLoading(true);

    try {
      const fileContent = await file.text();

      const mispResponse = await fetch("http://localhost:3001/misp-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: fileContent,
      });

      if (!mispResponse.ok) {
        const body = await mispResponse.text();
        throw new Error(
          `MISP analysis failed with HTTP ${mispResponse.status}: ${
            body || mispResponse.statusText
          }`,
        );
      }

      const mispOutput = await mispResponse.json();

      const response = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          misp_output: mispOutput,
          original_input: JSON.parse(fileContent),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${body || response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type") || "";
      let parsed: string;
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json && json.id) {
          router.push(`/analysis/result?id=${encodeURIComponent(json.id)}`);
          return;
        }
        parsed = JSON.stringify(json, null, 2);
      } else {
        parsed = await response.text();
      }

      setAnalysisResult(parsed);
      try {
        sessionStorage.setItem("analysisResult", parsed);
      } catch (storageError) {
        console.warn(
          "Failed to write analysis result to sessionStorage",
          storageError,
        );
      }
      router.push("/analysis/result");
    } catch (analysisError) {
      if (analysisError instanceof Error) {
        setError(`Failed to analyze file: ${analysisError.message}`);
      } else {
        setError("An unknown error occurred during analysis.");
      }
      console.error(analysisError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      setResultsLoading(true);
      setResultsError(null);
      try {
        const res = await fetch("http://localhost:3001/results");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setResults(json || []);
      } catch (fetchError) {
        console.error(fetchError);
        setResultsError("Failed to load previous results.");
      } finally {
        setResultsLoading(false);
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
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Upload
          </h1>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-medium text-slate-300">Package</h2>
            </div>

            <div className="p-5">
              <div
                {...getRootProps()}
                className={`rounded-2xl border border-dashed px-6 py-12 text-center transition-colors ${
                  isDragActive
                    ? "border-sky-300/70 bg-sky-400/10"
                    : "border-white/15 bg-black/10 hover:border-sky-300/40"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
                    {file ? (
                      <FileJson2 className="h-8 w-8" />
                    ) : (
                      <UploadCloud className="h-8 w-8" />
                    )}
                  </div>

                  <p className="mt-4 text-base font-medium text-white">
                    {isDragActive
                      ? "Drop file here"
                      : file
                        ? file.name
                        : "Drop JSON file here"}
                  </p>
                  {!file && !isDragActive && (
                    <p className="mt-1 text-sm text-slate-400">
                      or click to browse
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              {file && !error && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="mt-4 w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-medium text-slate-300">Recent</h2>
            </div>

            <div className="space-y-2 p-5">
              {resultsLoading && (
                <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-300">
                  Loading...
                </div>
              )}

              {resultsError && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {resultsError}
                </div>
              )}

              {!resultsLoading && !resultsError && results.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-300">
                  No results.
                </div>
              )}

              {!resultsLoading &&
                !resultsError &&
                results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3"
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
                        onClick={() =>
                          downloadResult(result.id, result.filename)
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {analysisResult && (
          <Card className="rounded-2xl p-4">
            <h2 className="text-sm font-medium text-slate-300">Result</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#060b14] p-4 text-sm text-slate-200">
              <code>{analysisResult}</code>
            </pre>
          </Card>
        )}
      </main>
    </div>
  );
}
