export type RankSignals = {
  vendorTrustScore: number;
  freshnessScore: number;
  reviewVolume: number;
  internalLinkCount: number;
};

export type RankInput<TItem> = {
  item: TItem;
  signals: RankSignals;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function computeBreakdown(signals: RankSignals) {
  const trust = clamp(Number(signals.vendorTrustScore) || 0, 0, 100) / 100;
  const freshness = clamp(Number(signals.freshnessScore) || 0, 0, 100) / 100;
  const reviewVolume = clamp((Number(signals.reviewVolume) || 0) / 50, 0, 1);
  const internalLinks = clamp(
    (Number(signals.internalLinkCount) || 0) / 25,
    0,
    1,
  );

  const trustContribution = trust * 0.45;
  const freshnessContribution = freshness * 0.25;
  const reviewContribution = reviewVolume * 0.2;
  const internalLinksContribution = internalLinks * 0.1;

  const weighted =
    trustContribution +
    freshnessContribution +
    reviewContribution +
    internalLinksContribution;

  return {
    score: Math.round(clamp(weighted * 100, 0, 100)),
    trustContribution,
    freshnessContribution,
    reviewContribution,
    internalLinksContribution,
  };
}

export function rankResults<TItem>(items: Array<RankInput<TItem>>) {
  return items
    .map((entry) => ({
      ...entry,
      ranking: computeBreakdown(entry.signals),
      explanation:
        `Trust ${(entry.signals.vendorTrustScore || 0).toFixed(0)}, ` +
        `freshness ${(entry.signals.freshnessScore || 0).toFixed(0)}, ` +
        `reviews ${entry.signals.reviewVolume || 0}, ` +
        `internal links ${entry.signals.internalLinkCount || 0}`,
    }))
    .sort((a, b) => b.ranking.score - a.ranking.score);
}
