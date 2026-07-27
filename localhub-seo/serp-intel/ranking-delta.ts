export type RankingRow = {
  keyword: string;
  url: string;
  previousPosition: number;
  currentPosition: number;
};

export type RankingDelta = RankingRow & {
  delta: number;
  trend: "up" | "down" | "flat";
};

export function calculateRankingDeltas(rows: RankingRow[]): RankingDelta[] {
  return rows.map((row) => {
    const delta = row.previousPosition - row.currentPosition;
    return {
      ...row,
      delta,
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    };
  });
}
