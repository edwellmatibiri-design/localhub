import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { computeRankingScore } from "@/lib/search/rankingFormula";
import { getSuppressionStatus } from "@/lib/quality/suppressVendor";
import { getVendorQualityData } from "@/lib/quality/scoring";
import { logSearch } from "@/lib/search/logSearch";

const SITE_ORIGIN = "https://localhub.co.za";

type Body = {
  intentId?: string;
};

type ListingRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string | null;
  updated_at: string;
};

type BoostType =
  | "search_boost"
  | "featured_vendor"
  | "featured_listing"
  | "category_sponsor"
  | "location_sponsor";

function safeText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

function normalizeUrl(url: string) {
  return url.replace(/\/$/, "");
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intentId = String(body.intentId ?? "").trim();
  if (!intentId) {
    return NextResponse.json(
      { error: "intentId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: intentNode, error: intentError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, landing_path")
      .eq("id", intentId)
      .maybeSingle();

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    if (!intentNode) {
      return NextResponse.json(
        { error: "Intent node not found" },
        { status: 404 },
      );
    }

    await logSearch({
      intentId,
      keyword: String(intentNode.keyword ?? intentNode.intent ?? ""),
      suggestionType: "intent",
    });

    const { data: generatedPage, error: pageError } = await supabase
      .from("generated_pages")
      .select("intent_id, title, meta_description, h1, internal_link_count")
      .eq("intent_id", intentId)
      .maybeSingle();

    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    const intentUrl = toAbsoluteUrl(String(intentNode.landing_path ?? ""));
    const { data: freshnessRow, error: freshnessError } = await supabase
      .from("freshness_scores")
      .select("score")
      .eq("page_url", intentUrl)
      .maybeSingle();

    let freshnessScore = Number(freshnessRow?.score ?? 0) || 0;

    if (freshnessError || !freshnessRow) {
      const { data: fallbackFreshness } = await supabase
        .from("freshness_scores")
        .select("score, page_url")
        .in("page_url", [intentUrl, normalizeUrl(intentUrl)]);

      if ((fallbackFreshness ?? []).length > 0) {
        freshnessScore = Number(fallbackFreshness?.[0]?.score ?? 0) || 0;
      }
    }

    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select(
        "id, seller_id, title, description, price, category_id, updated_at",
      )
      .eq("is_active", true)
      .limit(300);

    if (listingsError) {
      return NextResponse.json(
        { error: listingsError.message },
        { status: 500 },
      );
    }

    const intentTokens = [intentNode.keyword, intentNode.intent].map((token) =>
      safeText(token),
    );
    const matchedListings = ((listings ?? []) as ListingRow[]).filter(
      (listing) => {
        const haystack = `${safeText(listing.title)} ${safeText(listing.description)}`;
        return intentTokens.some((token) => token && haystack.includes(token));
      },
    );

    if (matchedListings.length === 0) {
      return NextResponse.json({
        intentId,
        ranked: [],
      });
    }

    const sellerIds = Array.from(
      new Set(matchedListings.map((listing) => listing.seller_id)),
    ).filter(Boolean);

    const [
      { data: trustRows },
      { data: reviewRows },
      { data: sellerRows },
      { data: performanceRows },
      { data: boostRows },
    ] = await Promise.all([
      supabase
        .from("vendor_trust_scores")
        .select("vendor_id, trust_score")
        .in("vendor_id", sellerIds),
      supabase
        .from("reviews")
        .select("seller_id, rating")
        .in("seller_id", sellerIds),
      supabase
        .from("seller_profiles")
        .select("id, business_name, category_id")
        .in("id", sellerIds),
      supabase
        .from("vendor_metrics")
        .select(
          "vendor_id, total_bookings, completed_bookings, cancelled_bookings, response_time_avg",
        )
        .in("vendor_id", sellerIds),
      supabase
        .from("boosts")
        .select("vendor_id, type, target")
        .in("vendor_id", sellerIds)
        .eq("status", "active")
        .gt("end_date", new Date().toISOString()),
    ]);

    const trustBySeller = new Map<string, number>();
    (trustRows ?? []).forEach((row) => {
      trustBySeller.set(
        String(row.vendor_id ?? ""),
        Number(row.trust_score) || 0,
      );
    });

    const reviewVolumeBySeller = new Map<string, number>();
    const reviewRatingBySeller = new Map<string, number[]>();
    (reviewRows ?? []).forEach((row) => {
      const sellerId = String(row.seller_id ?? "");
      reviewVolumeBySeller.set(
        sellerId,
        (reviewVolumeBySeller.get(sellerId) ?? 0) + 1,
      );
      reviewRatingBySeller.set(sellerId, [
        ...(reviewRatingBySeller.get(sellerId) ?? []),
        Number(row.rating) || 0,
      ]);
    });

    const vendorNameById = new Map<string, string>();
    const categoryIdByVendorId = new Map<string, string>();
    const categoryIds = new Set<string>();
    (sellerRows ?? []).forEach((row) => {
      const vendorId = String(row.id ?? "");
      const categoryId = String(row.category_id ?? "");
      vendorNameById.set(vendorId, String(row.business_name ?? "Vendor"));

      if (categoryId) {
        categoryIdByVendorId.set(vendorId, categoryId);
        categoryIds.add(categoryId);
      }
    });

    const { data: categoryRows } = categoryIds.size
      ? await supabase
          .from("categories")
          .select("id, name")
          .in("id", Array.from(categoryIds))
      : { data: [] as Array<{ id: string; name: string }> };

    const categoryNameById = new Map<string, string>(
      (categoryRows ?? []).map((row) => [String(row.id), String(row.name)]),
    );

    const [{ data: allCategories }, { data: allSuburbs }] = await Promise.all([
      supabase.from("categories").select("name, slug").limit(500),
      supabase.from("suburbs").select("name, slug").limit(1000),
    ]);

    const intentText = `${safeText(intentNode.keyword)} ${safeText(intentNode.intent)}`;
    const intentCategoryMatch = (allCategories ?? []).find((row) => {
      const name = safeText(row.name);
      const slug = safeText(row.slug);
      return (
        (name && intentText.includes(name)) ||
        (slug && intentText.includes(slug))
      );
    });
    const intentLocationMatch = (allSuburbs ?? []).find((row) => {
      const name = safeText(row.name);
      const slug = safeText(row.slug);
      return (
        (name && intentText.includes(name)) ||
        (slug && intentText.includes(slug))
      );
    });

    const intentCategory = safeText(
      intentCategoryMatch?.slug ?? intentCategoryMatch?.name ?? "",
    );
    const intentLocation = safeText(
      intentLocationMatch?.slug ?? intentLocationMatch?.name ?? "",
    );

    const boostsByVendor = new Map<
      string,
      Array<{
        type: BoostType;
        target: string | null;
      }>
    >();
    (boostRows ?? []).forEach((row) => {
      const vendorId = String(row.vendor_id ?? "");
      const existing = boostsByVendor.get(vendorId) ?? [];
      existing.push({
        type: String(row.type ?? "") as BoostType,
        target: row.target ? String(row.target) : null,
      });
      boostsByVendor.set(vendorId, existing);
    });

    const performanceByVendor = new Map<
      string,
      {
        completionRate: number;
        cancellationRate: number;
        responseTimeAvg: number;
      }
    >();
    (performanceRows ?? []).forEach((row) => {
      const vendorId = String(row.vendor_id ?? "");
      const totalBookings = Number(row.total_bookings) || 0;
      const completedBookings = Number(row.completed_bookings) || 0;
      const cancelledBookings = Number(row.cancelled_bookings) || 0;

      performanceByVendor.set(vendorId, {
        completionRate:
          totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        cancellationRate:
          totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
        responseTimeAvg: Number(row.response_time_avg) || 0,
      });
    });

    const qualityByVendor = new Map<string, number>();
    await Promise.all(
      sellerIds.map(async (vendorId) => {
        const { vendorQualityScore } = await getVendorQualityData(vendorId);
        qualityByVendor.set(vendorId, vendorQualityScore);
      }),
    );

    const ranked = matchedListings
      .map((listing) => {
        const vendorId = String(listing.seller_id ?? "");
        const trustScore = trustBySeller.get(vendorId) ?? 0;
        const reviewVolume = reviewVolumeBySeller.get(vendorId) ?? 0;
        const ratings = reviewRatingBySeller.get(vendorId) ?? [];
        const averageRating = ratings.length
          ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          : 0;
        const internalLinkCount =
          Number(generatedPage?.internal_link_count ?? 0) || 0;
        const vendorName = vendorNameById.get(vendorId) ?? "Vendor";
        const categoryName =
          categoryNameById.get(categoryIdByVendorId.get(vendorId) ?? "") ??
          "General";
        const performance = performanceByVendor.get(vendorId) ?? {
          completionRate: 0,
          cancellationRate: 0,
          responseTimeAvg: 0,
        };
        const vendorBoosts = boostsByVendor.get(vendorId) ?? [];

        const hasSearchBoost = vendorBoosts.some(
          (boost) => boost.type === "search_boost",
        );
        const hasFeaturedVendorBoost = vendorBoosts.some(
          (boost) => boost.type === "featured_vendor",
        );
        const hasFeaturedListingBoost = vendorBoosts.some(
          (boost) => boost.type === "featured_listing",
        );
        const matchingCategorySponsor = vendorBoosts.find(
          (boost) =>
            boost.type === "category_sponsor" &&
            safeText(boost.target ?? "") === intentCategory,
        );
        const matchingLocationSponsor = vendorBoosts.find(
          (boost) =>
            boost.type === "location_sponsor" &&
            safeText(boost.target ?? "") === intentLocation,
        );
        const sponsorBoost =
          matchingCategorySponsor ?? matchingLocationSponsor ?? null;
        const sponsorBoostType =
          sponsorBoost?.type === "category_sponsor" ||
          sponsorBoost?.type === "location_sponsor"
            ? sponsorBoost.type
            : null;
        const vendorQualityScore = qualityByVendor.get(vendorId) ?? 100;
        const suppressionStatus = getSuppressionStatus(vendorQualityScore);

        const updatedAt = Date.parse(String(listing.updated_at ?? ""));
        const ageDays = Number.isNaN(updatedAt)
          ? 0
          : Math.max(
              0,
              Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24)),
            );
        const recencyPenalty = Math.min(100, Math.round((ageDays / 90) * 100));

        const rankingScore = computeRankingScore({
          trustScore,
          freshnessScore,
          reviewVolume,
          internalLinkCount,
          recencyPenalty,
          completionRate: performance.completionRate,
          cancellationRate: performance.cancellationRate,
          responseTimeAvg: performance.responseTimeAvg,
          hasSearchBoost,
          hasFeaturedVendorBoost,
          hasFeaturedListingBoost,
          sponsorBoostType,
          sponsorBoostTarget: sponsorBoost?.target ?? null,
          intentCategory,
          intentLocation,
          suppressionStatus,
        });

        const badge =
          rankingScore >= 85
            ? "gold"
            : rankingScore >= 70
              ? "silver"
              : rankingScore >= 50
                ? "bronze"
                : "none";

        return {
          vendorId,
          listingId: listing.id,
          trustScore,
          freshnessScore,
          reviewVolume,
          internalLinkCount,
          recencyPenalty,
          completionRate: Number(performance.completionRate.toFixed(2)),
          cancellationRate: Number(performance.cancellationRate.toFixed(2)),
          responseTimeAvg: performance.responseTimeAvg,
          rankingScore,
          badge,
          listingTitle: listing.title,
          listingDescription: listing.description,
          vendorName,
          averageRating: Number(averageRating.toFixed(2)),
          serviceCategories: [categoryName],
          priceRange:
            typeof listing.price === "number"
              ? `R ${Math.max(0, Math.round(listing.price - listing.price * 0.15)).toLocaleString("en-ZA")} - R ${Math.round(
                  listing.price + listing.price * 0.15,
                ).toLocaleString("en-ZA")}`
              : "Contact for pricing",
          vendorQualityScore,
          suppressionStatus,
        };
      })
      .filter((item) => item.rankingScore > 0)
      .sort((a, b) => b.rankingScore - a.rankingScore);

    return NextResponse.json({
      intentId,
      ranked,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to rank search results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
