// Minimal Sidebar - Error Free
import { Badge } from "../ui/Badge";

const mockPackages = [
  { id: "1", title: "Suspicious Host Activity", severity: "high" as const },
  { id: "2", title: "Network Anomaly", severity: "medium" as const },
];

export function Sidebar() {
  return (
    <aside className="w-[260px] bg-gray-50 border-r border-gray-200 p-4">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Packages</h2>
      <div className="space-y-2">
        {mockPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-3 bg-white rounded border border-gray-200 hover:border-blue-500 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                {pkg.title}
              </span>
            </div>
            <Badge variant={pkg.severity}>{pkg.severity}</Badge>
          </div>
        ))}
      </div>
    </aside>
  );
}
