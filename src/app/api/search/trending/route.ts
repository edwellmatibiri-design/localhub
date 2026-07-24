import { NextResponse } from "next/server";
import { computeTrendingKeywords } from "@/lib/search/trending";

export async function GET() {
  try {
    const trending = await computeTrendingKeywords(20);

    return NextResponse.json({ trending });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to compute trending",
      },
      { status: 500 },
    );
  }
}
