"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/ui/Card";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [results, setResults] = useState<Array<{id:string;filename:string;created_at:number;size:number}>>([]);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setError(null);
      console.log("File ready for upload:", uploadedFile.name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
    onDropRejected: (fileRejections) => {
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

      const response = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: fileContent,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let parsed: string;
      if (contentType.includes("application/json")) {
        const json = await response.json();
        // If backend returned an id for a saved result, navigate to the result page by id
        if (json && json.id) {
          router.push(`/analysis/result?id=${encodeURIComponent(json.id)}`);
          return;
        }
        parsed = JSON.stringify(json, null, 2);
      } else {
        parsed = await response.text();
      }

      console.log("Analysis result:", parsed);
      setAnalysisResult(parsed);
      // Persist result so the results page can read it after navigation (fallback)
      try {
        sessionStorage.setItem("analysisResult", parsed);
      } catch (e) {
        console.warn("Failed to write analysis result to sessionStorage", e);
      }
      // Navigate to results page (no id available)
      router.push("/analysis/result");
    } catch (e) {
      if (e instanceof Error) {
        setError(`Failed to analyze file: ${e.message}`);
      } else {
        setError("An unknown error occurred during analysis.");
      }
      console.error(e);
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
      } catch (e) {
        console.error(e);
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
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to download result.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analyst Copilot
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload security alert packages to generate structured incident
            reports with MITRE ATT&CK mapping and threat intelligence
            enrichment.
          </p>
        </div>

        {/* Upload Zone */}
        <Card>
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-6">Upload Package</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                isDragActive
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  {isDragActive ? (
                    <p className="text-lg text-blue-700 font-medium mb-1">
                      Drop the file here ...
                    </p>
                  ) : (
                    <>
                      <p className="text-lg text-gray-700 font-medium mb-1">
                        {file
                          ? "File selected!"
                          : "Drop your JSON file here"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {file ? file.name : "or click to browse files"}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Supports: baseline.json, enriched.json
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            {!error && (
              <p className="text-sm text-gray-500 mt-4">
                Upload a security alert package in JSON format. The system will
                validate the schema and prepare it for analysis.
              </p>
            )}
            {file && !error && (
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className={`mt-6 w-full ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  "Analyze Package"
                )}
              </button>
            )}
            {/* Previous results dashboard */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Previous Analyses</h3>
              <Card>
                <div className="p-4">
                  {resultsLoading && <div className="text-center p-4">Loading...</div>}
                  {resultsError && <div className="text-sm text-red-600">{resultsError}</div>}
                  {!resultsLoading && results.length === 0 && (
                    <div className="text-sm text-gray-600 p-4">No previous results available.</div>
                  )}
                  {!resultsLoading && results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{r.filename}</div>
                            <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openResult(r.id)} className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 text-xs">View</button>
                            <button onClick={() => downloadResult(r.id, r.filename)} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 text-xs">Download</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {analysisResult && (
          <Card className="mt-8">
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-6">Analysis Result</h2>
              <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                <code>{analysisResult}</code>
              </pre>
            </div>
          </Card>
        )}

        {/* Instructions Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How It Works
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="font-semibold min-w-[20px]">1.</span>
              <span>
                Upload a JSON package containing security events from your SIEM
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold min-w-[20px]">2.</span>
              <span>
                System validates schema and enriches with MITRE ATT&CK and MISP
                data
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold min-w-[20px]">3.</span>
              <span>
                Review generated report with evidence, techniques, and
                recommendations
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold min-w-[20px]">4.</span>
              <span>Refine analysis and export final report</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
