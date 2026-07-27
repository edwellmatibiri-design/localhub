export type AnalyticsRow = {
  url: string;
  bounceRate: number;
  averageEngagementSeconds: number;
  scrollDepth: number;
  conversionRate: number;
  returnVisitorRate: number;
};

export type AnalyticsMetricUpsert = {
  url: string;
  bounceRate: number;
  dwellTimeSeconds: number;
  scrollDepth: number;
  conversionRate: number;
  returnVisitorRate: number;
  observedAtIso: string;
};

export function mapAnalyticsRows(rows: AnalyticsRow[], observedAt: Date): AnalyticsMetricUpsert[] {
  return rows.map((row) => ({
    url: row.url,
    bounceRate: row.bounceRate,
    dwellTimeSeconds: Math.round(row.averageEngagementSeconds),
    scrollDepth: row.scrollDepth,
    conversionRate: row.conversionRate,
    returnVisitorRate: row.returnVisitorRate,
    observedAtIso: observedAt.toISOString(),
  }));
}
