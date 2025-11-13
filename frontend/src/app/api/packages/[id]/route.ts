/**
 * Mock API Route - Package Detail
 *
 * Serves sample package data from data/samples/
 * In production, this would fetch from backend.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const packageId = params.id;

  // Map package IDs to sample files
  const sampleFiles: Record<string, string> = {
    ex1: "ex1-enriched.json",
    ex2: "ex1-enriched.json", // Reuse for demo
    baseline: "baseline.json",
  };

  const filename = sampleFiles[packageId];
  if (!filename) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  try {
    // Read from data/samples/ directory (relative to project root)
    const filePath = path.join(
      process.cwd(),
      "..",
      "data",
      "samples",
      filename
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const packageData = JSON.parse(fileContent);

    return NextResponse.json(packageData);
  } catch (error) {
    console.error("Error loading package:", error);
    return NextResponse.json(
      { error: "Failed to load package data" },
      { status: 500 }
    );
  }
}
