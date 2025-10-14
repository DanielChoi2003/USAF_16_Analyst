/**
 * SideNav Component
 *
 * Left sidebar (260px width) with package list and navigation.
 * Shows compact package cards with status indicators.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";

interface PackageItem {
  id: string;
  name: string;
  uploadedAt: string;
  eventsCount: number;
  status: "processing" | "enriched" | "error";
}

// Mock data - TODO: Replace with actual state/API
const mockPackages: PackageItem[] = [
  {
    id: "ex1",
    name: "PsExec Lateral Movement",
    uploadedAt: "2024-01-15T14:30:00Z",
    eventsCount: 12,
    status: "enriched",
  },
  {
    id: "ex2",
    name: "Suspicious PowerShell",
    uploadedAt: "2024-01-15T13:15:00Z",
    eventsCount: 8,
    status: "processing",
  },
];

export function SideNav() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[var(--header-height)] bottom-0 bg-slate-50 border-r border-slate-200 transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50 shadow-sm z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        )}
      </button>

      {/* Sidebar Content */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        {!collapsed && (
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Packages
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mockPackages.length} total
            </p>
          </div>
        )}

        {/* Package List */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-2">
            {mockPackages.map((pkg) => {
              const isActive = pathname === `/packages/${pkg.id}`;

              return (
                <li key={pkg.id}>
                  <Tooltip content={collapsed ? pkg.name : ""} side="right">
                    <Link
                      href={`/packages/${pkg.id}`}
                      className={cn(
                        "block p-3 rounded-md transition-colors",
                        "hover:bg-white hover:shadow-sm",
                        isActive &&
                          "bg-white shadow-md border-l-4 border-accent-500",
                        !isActive && "border-l-4 border-transparent"
                      )}
                    >
                      {collapsed ? (
                        // Collapsed view (icon only)
                        <div className="flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                      ) : (
                        // Expanded view
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Package className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-slate-900 truncate">
                                {pkg.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(pkg.uploadedAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {pkg.eventsCount} events
                            </span>
                            <Badge
                              variant={
                                pkg.status === "enriched"
                                  ? "success"
                                  : pkg.status === "error"
                                    ? "high"
                                    : "default"
                              }
                            >
                              {pkg.status}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Link>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
