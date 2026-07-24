export type MarketplaceRankingSignals = {
  trustScore: number;
  freshnessScore: number;
  reviewVolume: number;
  internalLinkCount: number;
  recencyPenalty: number;
  completionRate?: number;
  cancellationRate?: number;
  responseTimeAvg?: number;
  hasSearchBoost?: boolean;
  hasFeaturedVendorBoost?: boolean;
  hasFeaturedListingBoost?: boolean;
  sponsorBoostType?: "category_sponsor" | "location_sponsor" | null;
  sponsorBoostTarget?: string | null;
  intentCategory?: string | null;
  intentLocation?: string | null;
  suppressionStatus?: "none" | "reduced" | "hidden" | "blocked";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function computeRankingScore(
  signals: MarketplaceRankingSignals,
): number {
  const trust = clamp(Number(signals.trustScore) || 0, 0, 100) / 100;
  const freshness = clamp(Number(signals.freshnessScore) || 0, 0, 100) / 100;
  const reviews = clamp((Number(signals.reviewVolume) || 0) / 50, 0, 1);
  const internalLinks = clamp(
    (Number(signals.internalLinkCount) || 0) / 25,
    0,
    1,
  );
  const recencyPenalty =
    clamp(Number(signals.recencyPenalty) || 0, 0, 100) / 100;
  const completionRate =
    clamp(Number(signals.completionRate) || 0, 0, 100) / 100;
  const cancellationRate =
    clamp(Number(signals.cancellationRate) || 0, 0, 100) / 100;
  const responsePenalty = clamp(
    (Number(signals.responseTimeAvg) || 0) / 240,
    0,
    1,
  );

  const weighted =
    trust * 0.4 +
    freshness * 0.25 +
    reviews * 0.13 +
    internalLinks * 0.08 +
    completionRate * 0.03 -
    cancellationRate * 0.04 -
    responsePenalty * 0.05 -
    recencyPenalty * 0.04;

  let rankingScore = clamp(weighted * 100, 0, 100);

  if (signals.hasSearchBoost) {
    rankingScore *= 1.15;
  }

  if (signals.hasFeaturedVendorBoost) {
    rankingScore *= 1.2;
  }

  if (signals.hasFeaturedListingBoost) {
    rankingScore *= 1.25;
  }

  const sponsorType = String(signals.sponsorBoostType ?? "");
  const sponsorTarget = String(signals.sponsorBoostTarget ?? "").toLowerCase();
  const intentCategory = String(signals.intentCategory ?? "").toLowerCase();
  const intentLocation = String(signals.intentLocation ?? "").toLowerCase();

  if (
    sponsorType === "category_sponsor" &&
    sponsorTarget &&
    intentCategory &&
    sponsorTarget === intentCategory
  ) {
    rankingScore *= 1.3;
  }

  if (
    sponsorType === "location_sponsor" &&
    sponsorTarget &&
    intentLocation &&
    sponsorTarget === intentLocation
  ) {
    rankingScore *= 1.3;
  }

  if (signals.suppressionStatus === "reduced") {
    rankingScore *= 0.7;
  }

  if (signals.suppressionStatus === "hidden") {
    rankingScore = 0;
  }

  if (signals.suppressionStatus === "blocked") {
    rankingScore = 0;
  }

  return Math.round(clamp(rankingScore, 0, 100));
}
