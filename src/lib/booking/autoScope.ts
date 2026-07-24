export type JobSize = "small" | "medium" | "large";
export type JobComplexity = "low" | "medium" | "high";
import { scopeByCategory } from "@/lib/booking/scopingModels";

export type AutoScopeResult = {
  job_size: JobSize;
  job_complexity: JobComplexity;
  estimated_duration: number;
  estimated_team_size: number;
};

type ScopingConfig = {
  size_thresholds?: { tree_large_height?: number };
  duration_bonus?: { disposal?: number };
  complexity_increment?: { access_difficulty?: number };
};

function clampComplexity(value: number): JobComplexity {
  if (value <= 1) return "low";
  if (value === 2) return "medium";
  return "high";
}

export function buildAutoScope(input: {
  category: string;
  answers: Record<string, unknown>;
  config?: ScopingConfig;
}): AutoScopeResult {
  const category = String(input.category ?? "").toLowerCase();
  const answers = input.answers ?? {};
  const config = input.config ?? {};

  const treeLargeHeight = Number(
    config.size_thresholds?.tree_large_height ?? 10,
  );
  const disposalBonus = Number(config.duration_bonus?.disposal ?? 1);
  const accessComplexityInc = Number(
    config.complexity_increment?.access_difficulty ?? 1,
  );

  const base = scopeByCategory(category, answers);
  let size: JobSize = base.job_size;
  let complexityScore =
    base.job_complexity === "high"
      ? 3
      : base.job_complexity === "medium"
        ? 2
        : 1;
  let duration = Number(base.estimated_duration ?? 2);
  let team = Number(base.estimated_team_size ?? 1);

  if (category === "tree_felling") {
    const difficultAccess =
      String(answers.access_difficulty ?? "").toLowerCase() === "yes";
    const disposal =
      String(answers.disposal_needed ?? "").toLowerCase() === "yes";
    const height = Number(answers.tree_height ?? 0);

    if (height > treeLargeHeight) size = "large";
    if (difficultAccess) complexityScore += accessComplexityInc;
    if (disposal) duration += disposalBonus;
  }

  return {
    job_size: size,
    job_complexity: clampComplexity(complexityScore),
    estimated_duration: Math.round(duration * 10) / 10,
    estimated_team_size: team,
  };
}
