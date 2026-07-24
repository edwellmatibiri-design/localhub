import { NextResponse } from "next/server";
import { recordAdClick } from "@/lib/ads/biddingEngine";

type Body = {
  adId?: number | string;
  actorVendorId?: string;
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

  const adId = Number(body.adId);
  if (!Number.isFinite(adId) || adId <= 0) {
    return NextResponse.json(
      { ok: false, error: "adId is required" },
      { status: 400 },
    );
  }

  try {
    await recordAdClick(
      adId,
      body.actorVendorId ? String(body.actorVendorId).trim() : undefined,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to record click",
      },
      { status: 500 },
    );
  }
}
