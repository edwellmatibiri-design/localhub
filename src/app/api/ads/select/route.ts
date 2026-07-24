import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  recordAdImpression,
  selectCategoryAds,
  selectHomepageBanners,
  selectLocationAds,
  selectPpcSearchAds,
} from "@/lib/ads/biddingEngine";

type Body = {
  placement?: "search" | "category" | "location" | "homepage";
  keyword?: string;
  intent?: string;
  category?: string;
  location?: string;
  limit?: number;
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

  const placement = String(body.placement ?? "").trim();
  const limit = Math.max(1, Number(body.limit ?? 3));

  try {
    let ads: Array<{
      id: number;
      vendor_id: string;
      bid_amount: number;
      target: string | null;
    }> = [];

    if (placement === "search") {
      ads = await selectPpcSearchAds({
        keyword: body.keyword,
        intent: body.intent,
        limit,
      });
    } else if (placement === "category") {
      ads = await selectCategoryAds(String(body.category ?? ""), limit);
    } else if (placement === "location") {
      ads = await selectLocationAds(String(body.location ?? ""), limit);
    } else if (placement === "homepage") {
      ads = await selectHomepageBanners(limit);
    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid placement" },
        { status: 400 },
      );
    }

    await Promise.all(ads.map((ad) => recordAdImpression(Number(ad.id))));

    const supabase = createServiceClient();
    const vendorIds = Array.from(
      new Set(ads.map((ad) => String(ad.vendor_id))),
    );
    const { data: vendorRows } = vendorIds.length
      ? await supabase
          .from("seller_profiles")
          .select("id, business_name")
          .in("id", vendorIds)
      : { data: [] as Array<{ id: string; business_name: string }> };

    const vendorNameById = new Map<string, string>(
      (vendorRows ?? []).map((row) => [
        String(row.id),
        String(row.business_name),
      ]),
    );

    return NextResponse.json({
      ok: true,
      ads: ads.map((ad) => ({
        adId: Number(ad.id),
        vendorId: String(ad.vendor_id),
        vendorName: vendorNameById.get(String(ad.vendor_id)) ?? "Vendor",
        bidAmount: Number(ad.bid_amount),
        target: ad.target,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to select ads",
      },
      { status: 500 },
    );
  }
}
