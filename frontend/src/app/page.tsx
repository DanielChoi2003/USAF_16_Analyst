// Minimal Home Page - Error Free
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Three Column Layout (note I hard-coded these values) */}
          <div className="flex gap-6">
            {/* Column A: Events (320px) */}
            <div className="w-[320px]">
              <Card>
                <h2 className="text-lg font-bold mb-4">Events</h2>
                <div className="space-y-2">
                  <div className="p-2 border border-gray-200 rounded">
                    <div className="text-xs text-gray-500">
                      2024-01-15 14:30
                    </div>
                    <div className="text-sm font-medium">HOST-A</div>
                    <div className="text-xs text-gray-600">
                      Process: PsExec.exe
                    </div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded">
                    <div className="text-xs text-gray-500">
                      2024-01-15 14:31
                    </div>
                    <div className="text-sm font-medium">HOST-B</div>
                    <div className="text-xs text-gray-600">
                      Service: Install
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Column B: Enrichment (360px) */}
            <div className="w-[360px]">
              <Card>
                <h2 className="text-lg font-bold mb-4">Techniques</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-xs font-mono text-blue-700 mb-1">
                      T1569.002
                    </div>
                    <div className="text-sm font-medium">Remote Service</div>
                    <Badge variant="high">85% Confidence</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Column C: Report (flexible ~740px) */}
            <div className="flex-1">
              <Card>
                <h2 className="text-lg font-bold mb-4">Report</h2>
                <div className="prose">
                  <h3 className="text-md font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Suspicious PsExec execution detected on HOST-A, followed by
                    service installation on HOST-B. Activity matches T1569.002
                    (Remote Service) technique with high confidence. Recommend
                    immediate isolation and investigation.
                  </p>
                  <h3 className="text-md font-semibold mt-4 mb-2">
                    Observations
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>PsExec lateral movement detected</li>
                    <li>Service persistence established</li>
                    <li>MISP match on filename</li>
                  </ul>
                  <h3 className="text-md font-semibold mt-4 mb-2">
                    Recommendations
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>Isolate affected hosts immediately</li>
                    <li>Review service configurations</li>
                    <li>Check for additional compromised systems</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
