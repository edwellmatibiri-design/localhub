import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type AdType =
  | "ppc_search"
  | "ppc_listing"
  | "category_ad"
  | "location_ad"
  | "homepage_banner";

type Body = {
  vendorId?: string;
  type?: AdType;
  target?: string;
  bidAmount?: number;
  dailyBudget?: number;
  durationDays?: number;
};

const TYPES: AdType[] = [
  "ppc_search",
  "ppc_listing",
  "category_ad",
  "location_ad",
  "homepage_banner",
];

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
  const type = String(body.type ?? "").trim() as AdType;
  const target = String(body.target ?? "").trim() || null;
  const bidAmount = Number(body.bidAmount);
  const dailyBudget = Number(body.dailyBudget);
  const durationDays = Number(body.durationDays);

  if (
    !vendorId ||
    !TYPES.includes(type) ||
    !Number.isFinite(bidAmount) ||
    !Number.isFinite(dailyBudget) ||
    !Number.isFinite(durationDays)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "vendorId, type, bidAmount, dailyBudget, durationDays are required",
      },
      { status: 400 },
    );
  }

  if (bidAmount <= 0 || dailyBudget <= 0 || durationDays <= 0) {
    return NextResponse.json(
      { ok: false, error: "bidAmount, dailyBudget, durationDays must be > 0" },
      { status: 400 },
    );
  }

  try {
    const endDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("ads")
      .insert({
        vendor_id: vendorId,
        type,
        target,
        bid_amount: Math.round(bidAmount),
        daily_budget: Math.round(dailyBudget),
        status: "active",
        end_date: endDate,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, adId: data.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create ad",
      },
      { status: 500 },
    );
  }
}
