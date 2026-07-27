export type SearchConsoleRow = {
  url: string;
  keyword: string;
  ctr: number;
  position: number;
  impressions: number;
  clicks: number;
};

export type SeoMetricUpsert = {
  url: string;
  keyword: string;
  ctr: number;
  rankPosition: number;
  observedAtIso: string;
};

export function mapSearchConsoleRows(rows: SearchConsoleRow[], observedAt: Date): SeoMetricUpsert[] {
  return rows.map((row) => ({
    url: row.url,
    keyword: row.keyword,
    ctr: row.ctr,
    rankPosition: Math.round(row.position),
    observedAtIso: observedAt.toISOString(),
  }));
}
