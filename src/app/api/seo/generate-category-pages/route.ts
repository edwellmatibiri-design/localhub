import { callAI } from "@/lib/aiClient";
import {
  appFail,
  appOk,
  parseBody,
  requireInternalApiSecretFromRequest,
} from "@/lib/api";
import { canGeneratePage } from "@/lib/seoGuard";
import { shouldIndex } from "@/lib/seoIndexing";
import { scoreSeoContent } from "@/lib/seoQuality";
import { SEO_RULES } from "@/lib/seoRules";
import { findTopRatedSellers } from "@/lib/reviewTrust";

type Body = {
  category?: string;
  keywordVolume?: number;
  listingsCount?: number;
  traffic?: number;
  engagement?: number;
};

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  const body = await parseBody<Body>(request);
  const category = String(body?.category ?? "plumbing");
  const keywordVolume = Number(body?.keywordVolume ?? 0);
  const listingsCount = Number(body?.listingsCount ?? 0);
  const traffic = Number(body?.traffic ?? 0);
  const engagement = Number(body?.engagement ?? 0);

  if (!canGeneratePage({ keywordVolume, listingsCount })) {
    return appFail(
      400,
      "Generation blocked: insufficient keyword volume or listings.",
    );
  }

  const ai = await callAI(
    `Generate SEO category page content for ${category} in South Africa.`,
  );
  const draft = ai.text;
  const quality = scoreSeoContent(draft);
  if (!quality.pass) {
    return appFail(
      422,
      `Generation blocked: content quality below threshold (${quality.score.toFixed(2)}).`,
    );
  }

  const robots = SEO_RULES.indexing.defaultIndexState;
  const promotedToIndex = shouldIndex({
    traffic,
    engagement,
    listings: listingsCount,
    qualityScore: quality.score,
  });
  const topSellers = findTopRatedSellers(category);

  return appOk({
    category,
    draft,
    model: ai.model,
    quality,
    meta: {
      robots,
      promotedToIndex,
      robotsAfterPromotion: promotedToIndex ? "index,follow" : robots,
      sellerTrustScore: topSellers[0]?.trustScore ?? 0,
      reviewCount: topSellers[0]?.reviewCount ?? 0,
      trustBadges: topSellers.map((seller) => seller.trustBadge),
      topRatedSellers: topSellers,
    },
  });
}
