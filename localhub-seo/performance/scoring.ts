import type { PerformanceMetrics } from "./metrics";

export type PerformanceScore = {
  score: number;
  band: "poor" | "fair" | "good" | "excellent";
};

export function scorePerformance(metrics: PerformanceMetrics): PerformanceScore {
  const speedComponent = metrics.pageSpeedMs <= 1500 ? 1 : metrics.pageSpeedMs <= 2500 ? 0.7 : 0.4;
  const scoreRaw =
    metrics.ctr * 20 +
    (1 - metrics.bounceRate) * 20 +
    Math.min(1, metrics.dwellTimeSeconds / 120) * 15 +
    metrics.scrollDepth * 10 +
    metrics.conversionRate * 20 +
    metrics.returnVisitorRate * 10 +
    speedComponent * 5;

  const score = Math.round(scoreRaw);
  return { score, band: toBand(score) };
}

function toBand(score: number): PerformanceScore["band"] {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
