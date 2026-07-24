import type {
  EngagementMetric,
  SearchConsoleMetric,
} from "@/lib/seo/searchConsole";

export type FreshnessScoreInput = {
  search: SearchConsoleMetric;
  engagement?: EngagementMetric;
};

export function computeFreshnessScore(input: FreshnessScoreInput): number {
  const ctrScore = Math.min(1, input.search.ctr * 10);
  const positionScore = Math.max(0, 1 - (input.search.position - 1) / 30);
  const impressionsScore = Math.min(1, input.search.impressions / 2000);
  const clicksScore = Math.min(1, input.search.clicks / 300);

  const bounce = input.engagement?.bounce ?? 0.5;
  const dwell = input.engagement?.dwellSeconds ?? 45;
  const bounceScore = Math.max(0, 1 - bounce);
  const dwellScore = Math.min(1, dwell / 180);

  return Number(
    (
      ctrScore * 0.2 +
      positionScore * 0.2 +
      impressionsScore * 0.15 +
      clicksScore * 0.15 +
      bounceScore * 0.15 +
      dwellScore * 0.15
    ).toFixed(4),
  );
}
