/**
 * Package Detail Page
 *
 * Three-column layout: Events (340px) | Enrichment (360px) | Report (~700px)
 * Implements full Figma specification with interactions.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SideNav } from "@/components/layout/SideNav";
import { EventList } from "@/components/events/EventList";
import { TechniqueCard } from "@/components/enrichment/TechniqueCard";
import { MISPMatchRow } from "@/components/enrichment/MISPMatchRow";
import { ReportEditor } from "@/components/report/ReportEditor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Package } from "@/lib/types";

// Mock data loader - TODO: Replace with actual API
async function loadPackage(id: string): Promise<Package | null> {
  // In development, load from data/samples/ex1-enriched.json
  try {
    const response = await fetch("/api/packages/" + id);
    return await response.json();
  } catch (error) {
    console.error("Failed to load package:", error);
    return null;
  }
}

export default function PackageDetailPage() {
  const params = useParams();
  const packageId = params.id as string;

  const [packageData, setPackageData] = useState<Package | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>("");
  const [highlightedEventIds, setHighlightedEventIds] = useState<string[]>([]);

  // Load package data
  useEffect(() => {
    loadPackage(packageId).then(setPackageData);
  }, [packageId]);

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);

    // Highlight related techniques
    const relatedTechniques = packageData?.derived.attack_candidates.filter(
      (tech) => tech.evidence_event_ids.includes(eventId)
    );
    if (relatedTechniques && relatedTechniques.length > 0) {
      // Auto-select first related technique if none selected
      if (!selectedTechniqueId && relatedTechniques[0]) {
        setSelectedTechniqueId(relatedTechniques[0].technique_id);
      }
    }
  };

  // Handle technique selection
  const handleTechniqueSelect = (techniqueId: string) => {
    setSelectedTechniqueId(techniqueId);

    // Highlight related events
    const technique = packageData?.derived.attack_candidates.find(
      (t) => t.technique_id === techniqueId
    );
    if (technique) {
      setHighlightedEventIds(technique.evidence_event_ids);
    }
  };

  if (!packageData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <SideNav />
        <main className="pt-[var(--header-height)] pl-[var(--sidebar-width)] p-8">
          <div className="flex items-center justify-center h-[calc(100vh-var(--header-height))]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading package...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <SideNav />

      {/* Main Three-Column Layout */}
      <main className="fixed top-[var(--header-height)] left-[var(--sidebar-width)] right-0 bottom-0 overflow-hidden">
        <div className="h-full flex">
          {/* Column 1: Events (340px) */}
          <div className="w-[340px] h-full border-r border-slate-200 bg-white flex flex-col">
            <EventList
              events={packageData.events}
              selectedEventId={selectedEventId}
              highlightedEventIds={highlightedEventIds}
              onEventSelect={handleEventSelect}
            />
          </div>

          {/* Column 2: Enrichment (360px) */}
          <div className="w-[360px] h-full border-r border-slate-200 bg-white overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* MITRE ATT&CK Techniques */}
              <Card>
                <CardHeader>
                  <CardTitle>MITRE ATT&CK Techniques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {packageData.derived.attack_candidates.map((technique) => (
                    <TechniqueCard
                      key={technique.technique_id}
                      technique={technique}
                      isSelected={
                        selectedTechniqueId === technique.technique_id
                      }
                      onClick={() =>
                        handleTechniqueSelect(technique.technique_id)
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              {/* MISP Threat Intel */}
              {packageData.enrichment.misp_matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Threat Intelligence Matches (
                      {packageData.enrichment.misp_matches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {packageData.enrichment.misp_matches.map((match) => (
                      <MISPMatchRow
                        key={match.match_id}
                        match={match}
                        isHighlighted={
                          selectedEventId
                            ? match.evidence_event_ids.includes(selectedEventId)
                            : false
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Column 3: Report (flex remaining space ~700px) */}
          <div className="flex-1 h-full overflow-y-auto bg-slate-50">
            <div className="p-6 max-w-4xl">
              <ReportEditor
                report={packageData.report}
                recommendations={packageData.recommendations}
                onReportChange={(updatedReport) => {
                  setPackageData({
                    ...packageData,
                    report: updatedReport,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
