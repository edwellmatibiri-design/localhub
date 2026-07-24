export type CrawlPrioritySignals = {
  freshness: number;
  ageDays: number;
  internalLinks: number;
  impressions: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function computePriority(signals: CrawlPrioritySignals): number {
  const freshness = clamp(Number(signals.freshness) || 0, 0, 100);
  const ageDays = clamp(
    Number(signals.ageDays) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const internalLinks = clamp(
    Number(signals.internalLinks) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const impressions = clamp(
    Number(signals.impressions) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );

  const freshnessScore = freshness / 100;
  const ageScore = 1 - clamp(ageDays / 365, 0, 1);
  const internalLinksScore = clamp(internalLinks / 50, 0, 1);
  const impressionsScore = clamp(impressions / 10000, 0, 1);

  const weighted =
    freshnessScore * 0.5 +
    ageScore * 0.2 +
    internalLinksScore * 0.2 +
    impressionsScore * 0.1;

  return Math.round(clamp(weighted * 100, 0, 100));
}
