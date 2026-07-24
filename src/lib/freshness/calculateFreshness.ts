export type FreshnessSignals = {
  impressions: number;
  clicks: number;
  ctr: number;
  lastIndexedDaysAgo: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateFreshness(signals: FreshnessSignals): number {
  const impressions = clamp(
    Number(signals.impressions) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const clicks = clamp(Number(signals.clicks) || 0, 0, Number.MAX_SAFE_INTEGER);

  // Accept CTR as either ratio (0..1) or percent (0..100).
  const rawCtr = Number(signals.ctr) || 0;
  const ctr = rawCtr > 1 ? rawCtr / 100 : rawCtr;

  const lastIndexedDaysAgo = clamp(
    Number(signals.lastIndexedDaysAgo) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );

  const impressionsScore = clamp(impressions / 10000, 0, 1);
  const clicksScore = clamp(clicks / 1000, 0, 1);
  const ctrScore = clamp(ctr, 0, 1);
  const recencyScore = 1 - clamp(lastIndexedDaysAgo / 30, 0, 1);

  const weighted =
    impressionsScore * 0.4 +
    clicksScore * 0.3 +
    ctrScore * 0.2 +
    recencyScore * 0.1;

  return Math.round(clamp(weighted * 100, 0, 100));
}
