import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
};

function resolveBadge(trustScore: number) {
  if (trustScore >= 85) return "gold";
  if (trustScore >= 70) return "silver";
  if (trustScore >= 50) return "bronze";
  return "none";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const vendorId = String(body.vendorId ?? "").trim();
  if (!vendorId) {
    return NextResponse.json(
      { error: "vendorId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("vendor_trust_scores")
      .select("trust_score")
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ vendorId, trustScore: 0, badge: "none" });
    }

    const trustScore = Number(data.trust_score) || 0;
    return NextResponse.json({
      vendorId,
      trustScore,
      badge: resolveBadge(trustScore),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get vendor trust badge",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
