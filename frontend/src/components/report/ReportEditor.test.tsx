import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReportEditor } from "./ReportEditor";
import type { Report } from "@/lib/types";

const report: Report = {
  summary: "Initial analyst summary.",
  confidence: "High",
  observations: [
    { text: "Suspicious PowerShell execution observed.", evidence_event_ids: ["evt-1"] },
    { text: "Outbound network traffic followed execution.", evidence_event_ids: [] },
  ],
  raw_links: {
    kibana_search: "http://localhost:5601",
    ticket_reference: "INC-42",
  },
};

describe("ReportEditor", () => {
  it("supports editing summary and accepting AI-generated changes", async () => {
    const user = userEvent.setup();
    const onReportChange = vi.fn();

    render(
      <ReportEditor
        report={report}
        recommendations={["Isolate host", "Review related accounts"]}
        onReportChange={onReportChange}
      />,
    );

    const textarea = screen.getByPlaceholderText("Enter executive summary...");
    await user.clear(textarea);
    await user.type(textarea, "Updated summary for review.");
    await user.tab();

    expect(onReportChange).toHaveBeenCalled();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expand/i }));
    expect(screen.getByText("Review Changes")).toBeInTheDocument();
    expect(screen.getByText("AI-Generated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /accept changes/i }));
    expect(onReportChange).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.stringContaining("[AI-generated content based on expand]"),
      }),
    );
  });
});
