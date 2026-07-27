import type { SerpSnapshot } from "../data-lake/serp-snapshot";

export type SerpChange = {
  url: string;
  previousPosition: number | null;
  currentPosition: number;
  delta: number | null;
};

export function processSerpSnapshots(previous: SerpSnapshot | null, current: SerpSnapshot): SerpChange[] {
  const prevByUrl = new Map<string, number>();
  for (const row of previous?.results ?? []) {
    prevByUrl.set(row.url, row.position);
  }

  return current.results.map((row) => {
    const prevPosition = prevByUrl.get(row.url) ?? null;
    return {
      url: row.url,
      previousPosition: prevPosition,
      currentPosition: row.position,
      delta: prevPosition === null ? null : prevPosition - row.position,
    };
  });
}
