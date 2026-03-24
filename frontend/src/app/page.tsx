import { Header } from "../components/layout/Header";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <main className="flex-1 p-6">
          <div className="flex gap-6">
            <div className="w-[320px]">
              <Card>
                <h2 className="mb-4 text-lg font-bold">Events</h2>
                <div className="space-y-2">
                  <div className="rounded border border-gray-200 p-2">
                    <div className="text-xs text-gray-500">2024-01-15 14:30</div>
                    <div className="text-sm font-medium">HOST-A</div>
                    <div className="text-xs text-gray-600">
                      Process: PsExec.exe
                    </div>
                  </div>
                  <div className="rounded border border-gray-200 p-2">
                    <div className="text-xs text-gray-500">2024-01-15 14:31</div>
                    <div className="text-sm font-medium">HOST-B</div>
                    <div className="text-xs text-gray-600">
                      Service: Install
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="w-[360px]">
              <Card>
                <h2 className="mb-4 text-lg font-bold">Techniques</h2>
                <div className="space-y-3">
                  <div className="rounded bg-blue-50 p-3">
                    <div className="mb-1 text-xs font-mono text-blue-700">
                      T1569.002
                    </div>
                    <div className="text-sm font-medium">Remote Service</div>
                    <Badge variant="high">85% Confidence</Badge>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex-1">
              <Card>
                <h2 className="mb-4 text-lg font-bold">Report</h2>
                <div className="prose">
                  <h3 className="mb-2 text-md font-semibold">Summary</h3>
                  <p className="text-sm leading-relaxed text-gray-700">
                    Suspicious PsExec execution detected on HOST-A, followed by
                    service installation on HOST-B. Activity matches T1569.002
                    (Remote Service) technique with high confidence. Recommend
                    immediate isolation and investigation.
                  </p>
                  <h3 className="mb-2 mt-4 text-md font-semibold">
                    Observations
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>PsExec lateral movement detected</li>
                    <li>Service persistence established</li>
                    <li>MISP match on filename</li>
                  </ul>
                  <h3 className="mb-2 mt-4 text-md font-semibold">
                    Recommendations
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
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
