import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventRow } from "./EventRow";
import type { Event } from "@/lib/types";

const baseEvent: Event = {
  id: "evt-1",
  timestamp: "2026-04-15T12:00:00Z",
  category: "host",
  subtype: "process_create",
  action: "created",
  host: { name: "analyst-host", ip: "10.0.0.5" },
  iocs: { matched: false, matches: [] },
  raw_excerpt: "{\"process\":\"powershell.exe\"}",
  ext: {},
};

describe("EventRow", () => {
  it("renders summary fields and expands raw excerpt", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<EventRow event={baseEvent} onClick={onClick} />);

    expect(screen.getByText("process_create")).toBeInTheDocument();
    expect(screen.getByText("analyst-host")).toBeInTheDocument();
    expect(screen.queryByText(baseEvent.raw_excerpt)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByText(baseEvent.raw_excerpt)).toBeInTheDocument();

    await user.click(screen.getByText("process_create"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
