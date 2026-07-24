import { createServiceClient } from "@/lib/db";

export type AdType =
  | "ppc_search"
  | "ppc_listing"
  | "category_ad"
  | "location_ad"
  | "homepage_banner";

type AdRow = {
  id: number;
  vendor_id: string;
  type: AdType;
  target: string | null;
  bid_amount: number;
  daily_budget: number;
  spent_today: number;
  impressions: number;
  clicks: number;
  status: "active" | "paused" | "exhausted";
  start_date: string;
  end_date: string;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function weightedShuffle(items: AdRow[]) {
  const pool = [...items];
  const result: AdRow[] = [];

  while (pool.length > 0) {
    const totalWeight = pool.reduce(
      (sum, item) => sum + Math.max(1, Number(item.bid_amount) || 1),
      0,
    );
    let marker = Math.random() * totalWeight;
    let index = 0;

    for (; index < pool.length; index += 1) {
      marker -= Math.max(1, Number(pool[index].bid_amount) || 1);
      if (marker <= 0) break;
    }

    const picked = pool.splice(Math.min(index, pool.length - 1), 1)[0];
    result.push(picked);
  }

  return result;
}

async function safeFlagVendor(vendorId: string, note: string, severity = 4) {
  try {
    const supabase = createServiceClient();
    await supabase.from("quality_flags").insert({
      vendor_id: vendorId,
      type: "suspicious_activity",
      severity,
      notes: note,
    });
  } catch {
    // keep ad-serving path resilient even if flags table is not yet migrated
  }
}

async function isEligibleBase(type: AdType) {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("ads")
    .select(
      "id, vendor_id, type, target, bid_amount, daily_budget, spent_today, impressions, clicks, status, start_date, end_date",
    )
    .eq("type", type)
    .eq("status", "active")
    .lte("start_date", nowIso)
    .gte("end_date", nowIso)
    .limit(300);

  return ((data ?? []) as AdRow[]).filter(
    (ad) => Number(ad.spent_today ?? 0) < Number(ad.daily_budget ?? 0),
  );
}

export async function selectPpcSearchAds(params: {
  keyword?: string;
  intent?: string;
  limit?: number;
}) {
  const keyword = normalize(params.keyword);
  const intent = normalize(params.intent);
  const limit = Math.max(1, Number(params.limit ?? 3));

  const ads = await isEligibleBase("ppc_search");
  return ads
    .filter((ad) => {
      const target = normalize(ad.target);
      if (!target) return true;
      return (
        (keyword && target.includes(keyword)) ||
        (intent && target.includes(intent)) ||
        (keyword && keyword.includes(target))
      );
    })
    .sort((a, b) => Number(b.bid_amount) - Number(a.bid_amount))
    .slice(0, limit);
}

export async function selectCategoryAds(category: string, limit = 3) {
  const target = normalize(category);
  const ads = await isEligibleBase("category_ad");
  return ads
    .filter((ad) => normalize(ad.target) === target)
    .sort((a, b) => Number(b.bid_amount) - Number(a.bid_amount))
    .slice(0, Math.max(1, limit));
}

export async function selectLocationAds(location: string, limit = 3) {
  const target = normalize(location);
  const ads = await isEligibleBase("location_ad");
  return ads
    .filter((ad) => normalize(ad.target) === target)
    .sort((a, b) => Number(b.bid_amount) - Number(a.bid_amount))
    .slice(0, Math.max(1, limit));
}

export async function selectHomepageBanners(limit = 2) {
  const ads = await isEligibleBase("homepage_banner");
  return weightedShuffle(ads).slice(0, Math.max(1, limit));
}

export async function recordAdImpression(adId: number) {
  const supabase = createServiceClient();
  const { data: ad } = await supabase
    .from("ads")
    .select(
      "id, vendor_id, bid_amount, daily_budget, spent_today, impressions, clicks, status",
    )
    .eq("id", adId)
    .maybeSingle();

  if (!ad) return;

  const nextSpent = Number(ad.spent_today ?? 0) + Number(ad.bid_amount ?? 0);
  const nextImpressions = Number(ad.impressions ?? 0) + 1;
  const exhausted = nextSpent >= Number(ad.daily_budget ?? 0);

  await supabase
    .from("ads")
    .update({
      spent_today: nextSpent,
      impressions: nextImpressions,
      status: exhausted ? "exhausted" : ad.status,
    })
    .eq("id", adId);

  if (nextImpressions >= 10000) {
    await safeFlagVendor(
      String(ad.vendor_id),
      `Ad ${adId} impressions spike detected (${nextImpressions}).`,
      3,
    );
  }
}

export async function recordAdClick(adId: number, actorVendorId?: string) {
  const supabase = createServiceClient();
  const { data: ad } = await supabase
    .from("ads")
    .select(
      "id, vendor_id, bid_amount, daily_budget, spent_today, impressions, clicks, status",
    )
    .eq("id", adId)
    .maybeSingle();

  if (!ad) {
    throw new Error("Ad not found");
  }

  const ownClick =
    actorVendorId && normalize(actorVendorId) === normalize(ad.vendor_id);
  const nextSpent = Number(ad.spent_today ?? 0) + Number(ad.bid_amount ?? 0);
  const nextClicks = Number(ad.clicks ?? 0) + 1;
  const exhausted = nextSpent >= Number(ad.daily_budget ?? 0);
  const ctr = (nextClicks / Math.max(1, Number(ad.impressions ?? 0))) * 100;
  const abnormalClickSpike =
    nextClicks >= 200 || (ctr >= 80 && Number(ad.impressions ?? 0) >= 50);

  const shouldPause = ownClick || abnormalClickSpike;

  await supabase
    .from("ads")
    .update({
      clicks: nextClicks,
      spent_today: nextSpent,
      status: shouldPause ? "paused" : exhausted ? "exhausted" : ad.status,
    })
    .eq("id", adId);

  if (ownClick) {
    await safeFlagVendor(
      String(ad.vendor_id),
      `Vendor clicked own ad ${adId}. Auto-paused.`,
      5,
    );
  } else if (abnormalClickSpike) {
    await safeFlagVendor(
      String(ad.vendor_id),
      `Abnormal click spike on ad ${adId}. Auto-paused.`,
      4,
    );
  }
}
