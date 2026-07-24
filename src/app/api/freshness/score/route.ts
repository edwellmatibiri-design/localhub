import { NextResponse } from "next/server";
import {
  calculateFreshness,
  type FreshnessSignals,
} from "@/lib/freshness/calculateFreshness";

type Body = {
  url?: string;
};

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function hashText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function fetchMockSearchConsoleSignals(
  url: string,
): Promise<FreshnessSignals> {
  // Mocked GSC metrics derived from URL hash so values remain stable per URL.
  const seed = hashText(url);
  return {
    impressions: 100 + (seed % 9901),
    clicks: 10 + (seed % 891),
    ctr: (seed % 2001) / 10000,
    lastIndexedDaysAgo: seed % 60,
  };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = String(body?.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "url must be a valid absolute URL" },
      { status: 400 },
    );
  }

  try {
    const signals = await fetchMockSearchConsoleSignals(url);
    const score = calculateFreshness(signals);

    return NextResponse.json({
      url,
      score,
      signals,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to compute freshness score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
