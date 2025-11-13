"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setError(null);
      // Here you would typically handle the file upload to a server
      // For now, we'll just log it and prepare for redirection.
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
              <button className="mt-6 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Analyze Package
              </button>
            )}
          </div>
        </Card>

        {/* Sample Packages Section */}
        {/* <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Sample Packages
            </h2>
            <span className="text-sm text-gray-500">
              Click to view analysis
            </span>
          </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/packages/sample-1">
              <Card>
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      PsExec Lateral Movement
                    </h3>
                    <Badge variant="high">High</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Suspicious remote service execution detected across multiple
                    hosts. Matches T1569.002 technique.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>12 events</span>
                    <span>•</span>
                    <span>3 techniques</span>
                    <span>•</span>
                    <span>2025-09-21</span>
                  </div>
                </div>
              </Card>
            </Link> */}

            {/* Sample Package 2 */}
            {/* <Link href="/packages/sample-2">
              <Card>
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      DNS Tunneling Activity
                    </h3>
                    <Badge variant="medium">Medium</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Anomalous DNS query patterns consistent with data
                    exfiltration attempts.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>8 events</span>
                    <span>•</span>
                    <span>2 techniques</span>
                    <span>•</span>
                    <span>2025-09-20</span>
                  </div>
                </div>
              </Card>
            </Link> */}

            {/* Sample Package 3 */}
            {/* <Link href="/">
              <Card>
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Credential Dumping
                    </h3>
                    <Badge variant="high">High</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    LSASS memory access detected. Potential credential theft in
                    progress.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>6 events</span>
                    <span>•</span>
                    <span>4 techniques</span>
                    <span>•</span>
                    <span>2025-09-19</span>
                  </div>
                </div>
              </Card>
            </Link> */}

            {/* Sample Package 4 */}
            {/* <Link href="/packages/sample-4">
              <Card>
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Baseline Template
                    </h3>
                    <Badge variant="low">Info</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Empty package template for testing and development purposes.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>0 events</span>
                    <span>•</span>
                    <span>0 techniques</span>
                    <span>•</span>
                    <span>Template</span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div> */}

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
