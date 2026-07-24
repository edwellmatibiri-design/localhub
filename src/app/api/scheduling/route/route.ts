import { NextResponse } from "next/server";
import { getOptimizedRoute } from "@/lib/scheduling/routePlanner";

type Body = {
  vendorId?: string;
  date?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const vendorId = String(body.vendorId ?? "").trim();
  const date = String(body.date ?? "").trim();

  if (!vendorId || !date) {
    return NextResponse.json(
      { ok: false, error: "vendorId and date are required" },
      { status: 400 },
    );
  }

  try {
    const optimized = await getOptimizedRoute({ vendorId, date });
    return NextResponse.json({
      ok: true,
      orderedBookings: optimized.orderedBookings,
      estimatedTravelTime: optimized.estimatedTravelTime,
      estimatedCompletionTime: optimized.estimatedCompletionTime,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to build route",
      },
      { status: 500 },
    );
  }
}
