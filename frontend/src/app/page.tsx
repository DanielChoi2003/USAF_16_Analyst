"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Header } from "../components/layout/Header";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type Severity = "high" | "medium" | "low";

type AlertEvent = {
  time: string;
  host: string;
  detail: string;
  severity: Severity;
};

type AlertRecord = {
  id: string;
  title: string;
  timestamp: string;
  technique: string;
  severity: Severity;
  confidence: number;
  iocMatches: number;
  events: AlertEvent[];
  recommendations: string[];
  report: string;
};

const alerts: AlertRecord[] = [
  {
    id: "alert-001",
    title: "PsExec Lateral Movement",
    timestamp: "2026-03-30 14:34",
    technique: "T1569.002",
    severity: "high",
    confidence: 85,
    iocMatches: 3,
    events: [
      {
        time: "14:30",
        host: "HOST-A",
        detail: "PsExec.exe spawned under remote service context",
        severity: "high",
      },
      {
        time: "14:31",
        host: "HOST-B",
        detail: "Service install",
        severity: "medium",
      },
      {
        time: "14:34",
        host: "HOST-C",
        detail: "MISP hash match",
        severity: "low",
      },
    ],
    recommendations: [
      "Isolate HOST-A and HOST-B.",
      "Review service creation telemetry.",
      "Check for credential reuse.",
    ],
    report:
      "Suspicious PsExec execution was observed on HOST-A, followed by remote service installation on HOST-B. Enrichment indicates overlap with lateral movement tradecraft and a supporting MISP filename match. Immediate containment is recommended.",
  },
  {
    id: "alert-002",
    title: "Encoded PowerShell Execution",
    timestamp: "2026-03-30 13:08",
    technique: "T1059.001",
    severity: "medium",
    confidence: 74,
    iocMatches: 1,
    events: [
      {
        time: "13:02",
        host: "HOST-D",
        detail: "powershell.exe launched with encoded command",
        severity: "medium",
      },
      {
        time: "13:05",
        host: "HOST-D",
        detail: "Outbound connection to rare domain",
        severity: "medium",
      },
      {
        time: "13:08",
        host: "HOST-D",
        detail: "Process spawned from user temp directory",
        severity: "low",
      },
    ],
    recommendations: [
      "Review PowerShell command content.",
      "Inspect outbound network connections.",
      "Check child process lineage on HOST-D.",
    ],
    report:
      "Encoded PowerShell activity was observed on HOST-D with follow-on outbound traffic to a low-prevalence domain. The sequence is suspicious but currently lower confidence than the lateral movement case. Additional command-line and network review is recommended.",
  },
  {
    id: "alert-003",
    title: "Suspicious Service Creation",
    timestamp: "2026-03-30 11:46",
    technique: "T1543.003",
    severity: "medium",
    confidence: 68,
    iocMatches: 2,
    events: [
      {
        time: "11:40",
        host: "HOST-E",
        detail: "New Windows service created",
        severity: "medium",
      },
      {
        time: "11:43",
        host: "HOST-E",
        detail: "Binary path points to non-standard directory",
        severity: "medium",
      },
      {
        time: "11:46",
        host: "HOST-E",
        detail: "Filename matched prior intel reference",
        severity: "low",
      },
    ],
    recommendations: [
      "Review service binary and startup path.",
      "Validate service creation source account.",
      "Search fleet for matching service names.",
    ],
    report:
      "A new Windows service was created on HOST-E with a binary path outside expected locations. Supporting telemetry and one intel match suggest a potentially malicious persistence mechanism. Service review and broader hunting are recommended.",
  },
];

export default function HomePage() {
  const [selectedAlertId, setSelectedAlertId] = useState(alerts[0]?.id ?? "");

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0],
    [selectedAlertId],
  );

  const handleDownload = () => {
    if (!selectedAlert) return;

    const blob = new Blob([JSON.stringify(selectedAlert, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedAlert.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!selectedAlert) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Card className="rounded-2xl p-4">
            <div className="text-sm text-slate-300">No alerts available.</div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">{selectedAlert.title}</p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <Card className="rounded-2xl p-4">
            <h2 className="text-sm font-medium text-slate-300">Alerts</h2>
            <div className="mt-4 space-y-2">
              {alerts.map((alert) => {
                const isSelected = alert.id === selectedAlert.id;

                return (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-sky-400/40 bg-sky-400/10"
                        : "border-white/10 bg-black/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {alert.timestamp}
                        </p>
                      </div>
                      <Badge variant={alert.severity}>{alert.severity}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Technique
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-lg text-white">
                    {selectedAlert.technique}
                  </span>
                  <Badge variant={selectedAlert.severity}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
              </Card>

              <Card className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Confidence
                </p>
                <p className="mt-3 font-display text-2xl text-white">
                  {selectedAlert.confidence}%
                </p>
              </Card>

              <Card className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  IOC Matches
                </p>
                <p className="mt-3 font-display text-2xl text-white">
                  {selectedAlert.iocMatches}
                </p>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_0.85fr_1.2fr]">
              <Card className="rounded-2xl p-4">
                <h2 className="text-sm font-medium text-slate-300">Events</h2>
                <div className="mt-4 space-y-2">
                  {selectedAlert.events.map((event) => (
                    <div
                      key={`${selectedAlert.id}-${event.host}-${event.time}`}
                      className="rounded-xl border border-white/10 bg-black/10 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {event.host}
                          </p>
                          <p className="text-sm text-slate-400">
                            {event.detail}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={event.severity}>{event.time}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-2xl p-4">
                <h2 className="text-sm font-medium text-slate-300">
                  Recommendations
                </h2>
                <div className="mt-4 space-y-2">
                  {selectedAlert.recommendations.map((item) => (
                    <div
                      key={`${selectedAlert.id}-${item}`}
                      className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-2xl p-4">
                <h2 className="text-sm font-medium text-slate-300">Report</h2>
                <div className="mt-4 rounded-xl border border-white/10 bg-[#060b14] p-4">
                  <p className="text-sm leading-7 text-slate-300">
                    {selectedAlert.report}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
