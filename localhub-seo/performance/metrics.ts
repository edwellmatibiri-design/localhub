export type PerformanceMetrics = {
  ctr: number;
  bounceRate: number;
  dwellTimeSeconds: number;
  scrollDepth: number;
  conversionRate: number;
  returnVisitorRate: number;
  pageSpeedMs: number;
};

export function normaliseMetrics(metrics: PerformanceMetrics): PerformanceMetrics {
  return {
    ctr: clamp(metrics.ctr, 0, 1),
    bounceRate: clamp(metrics.bounceRate, 0, 1),
    dwellTimeSeconds: Math.max(0, Math.round(metrics.dwellTimeSeconds)),
    scrollDepth: clamp(metrics.scrollDepth, 0, 1),
    conversionRate: clamp(metrics.conversionRate, 0, 1),
    returnVisitorRate: clamp(metrics.returnVisitorRate, 0, 1),
    pageSpeedMs: Math.max(0, Math.round(metrics.pageSpeedMs)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
