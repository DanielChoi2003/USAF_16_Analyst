import { describe, expect, it, vi } from "vitest";
import {
  cn,
  extractHostname,
  formatConfidence,
  formatRelativeTime,
  getConfidenceColor,
  getSeverityColor,
  highlightText,
  truncate,
} from "./utils";

describe("utils", () => {
  it("merges classes and formats text helpers", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toContain("px-4");
    expect(truncate("abcdef", 4)).toBe("abcd...");
    expect(extractHostname("server.example.mil")).toBe("server");
    expect(extractHostname("10.0.0.7")).toBe("10.0.0.7");
    expect(getSeverityColor("High")).toBe("danger");
    expect(getConfidenceColor(0.9)).toBe("success");
    expect(formatConfidence(0.856)).toBe("86%");
    expect(highlightText("Alert package", "pack")).toContain("<mark");
  });

  it("formats relative time with short units", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));

    expect(formatRelativeTime("2026-04-15T11:59:45Z")).toBe("15s ago");
    expect(formatRelativeTime("2026-04-15T11:30:00Z")).toBe("30m ago");
    expect(formatRelativeTime("2026-04-15T09:00:00Z")).toBe("3h ago");

    vi.useRealTimers();
  });
});
