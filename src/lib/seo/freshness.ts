import { computeFreshnessScore } from "@/lib/seo/freshnessScore";
import {
  fetchEngagementMetrics,
  fetchSearchConsoleMetrics,
} from "@/lib/seo/searchConsole";

export type FreshnessRow = {
  path: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  bounce: number;
  dwellTime: number;
  score: number;
};

export type FreshnessDecision = {
  refresh: string[];
  reinforce: string[];
  retire: string[];
  revalidate: string[];
  rows: FreshnessRow[];
};

export async function evaluateFreshnessWindow(
  startDate: string,
  endDate: string,
): Promise<FreshnessDecision> {
  const [searchRows, engagementRows] = await Promise.all([
    fetchSearchConsoleMetrics(startDate, endDate),
    fetchEngagementMetrics(),
  ]);

  const engagementMap = new Map(
    engagementRows.map((item) => [item.path, item]),
  );
  const rows: FreshnessRow[] = searchRows.map((search) => {
    const engagement = engagementMap.get(search.path);
    const score = computeFreshnessScore({ search, engagement });

    return {
      path: search.path,
      impressions: search.impressions,
      clicks: search.clicks,
      ctr: search.ctr,
      position: search.position,
      bounce: engagement?.bounce ?? 0.5,
      dwellTime: engagement?.dwellSeconds ?? 45,
      score,
    };
  });

  const refresh = rows.filter((row) => row.score < 0.45).map((row) => row.path);
  const reinforce = rows
    .filter((row) => row.score >= 0.75)
    .map((row) => row.path);
  const retire = rows
    .filter((row) => row.impressions < 20 && row.clicks < 3 && row.score < 0.35)
    .map((row) => row.path);

  const revalidate = Array.from(new Set([...refresh, ...reinforce]));

  return { refresh, reinforce, retire, revalidate, rows };
}

export async function triggerFreshnessRevalidation(
  decision: FreshnessDecision,
  revalidatePath: (path: string) => void,
) {
  decision.revalidate.forEach((path) => {
    revalidatePath(path);
  });
}
