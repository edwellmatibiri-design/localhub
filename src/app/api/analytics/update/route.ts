import { NextResponse } from "next/server";
import { recomputeAnalytics } from "@/lib/analytics/recompute";
import { logEvent } from "@/lib/log";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await logEvent("analytics_update", { timestamp: Date.now() });
    const summary = await recomputeAnalytics({ includeMarketplace: true });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update analytics",
      },
      { status: 500 },
    );
  }
}
