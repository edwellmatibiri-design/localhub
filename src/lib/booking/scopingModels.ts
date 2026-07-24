export type CategoryScopeResult = {
  job_size: "small" | "medium" | "large";
  job_complexity: "low" | "medium" | "high";
  estimated_duration: number;
  estimated_team_size: number;
};

type ScopeModelInput = {
  answers: Record<string, unknown>;
};

function toYes(value: unknown) {
  return String(value ?? "").toLowerCase() === "yes";
}

export function scopeTreeFelling(input: ScopeModelInput): CategoryScopeResult {
  const answers = input.answers;
  const height = Number(answers.tree_height ?? 0);
  const difficultAccess = toYes(answers.access_difficulty);
  const disposal = toYes(answers.disposal_needed);

  const job_size = height > 10 ? "large" : height >= 6 ? "medium" : "small";
  let complexityScore = difficultAccess ? 2 : 1;
  if (height > 10) complexityScore += 1;

  const job_complexity =
    complexityScore >= 3 ? "high" : complexityScore === 2 ? "medium" : "low";
  let estimated_duration = height > 10 ? 4 : height >= 6 ? 3 : 2;
  if (disposal) estimated_duration += 1;

  return {
    job_size,
    job_complexity,
    estimated_duration,
    estimated_team_size: job_size === "large" ? 3 : 2,
  };
}

export function scopePlumbing(input: ScopeModelInput): CategoryScopeResult {
  const answers = input.answers;
  const issueType = String(answers.issue_type ?? "other").toLowerCase();
  const severity = String(answers.severity ?? "low").toLowerCase();
  const urgency = String(answers.urgency ?? "flexible").toLowerCase();

  const job_size =
    issueType === "burst_pipe"
      ? "large"
      : issueType === "install"
        ? "medium"
        : "small";
  const job_complexity =
    severity === "high" ? "high" : severity === "medium" ? "medium" : "low";
  const estimated_duration =
    urgency === "today" ? 2 : urgency === "this_week" ? 3 : 4;

  return {
    job_size,
    job_complexity,
    estimated_duration,
    estimated_team_size: job_complexity === "high" ? 2 : 1,
  };
}

export function scopeCleaning(input: ScopeModelInput): CategoryScopeResult {
  const answers = input.answers;
  const homeSize = Number(answers.home_size ?? 0);
  const pets = toYes(answers.pets);
  const frequency = String(answers.frequency ?? "once_off").toLowerCase();

  const job_size =
    homeSize >= 220 ? "large" : homeSize >= 110 ? "medium" : "small";
  const job_complexity = pets ? "medium" : "low";
  const estimated_duration =
    frequency === "weekly"
      ? 2
      : frequency === "bi_weekly"
        ? 3
        : frequency === "monthly"
          ? 4
          : 5;

  return {
    job_size,
    job_complexity,
    estimated_duration,
    estimated_team_size: job_size === "large" ? 3 : 2,
  };
}

export function scopeRubbleRemoval(
  input: ScopeModelInput,
): CategoryScopeResult {
  const answers = input.answers;
  const loadSize = String(answers.load_size ?? "small").toLowerCase();
  const distance = Number(answers.distance ?? 0);
  const access = String(answers.access ?? "easy").toLowerCase();

  const job_size =
    loadSize === "large" ? "large" : loadSize === "medium" ? "medium" : "small";
  const job_complexity = /difficult|tight|limited/.test(access)
    ? "high"
    : "medium";
  const estimated_duration = Math.max(
    2,
    Math.round(distance / 10) + (job_size === "large" ? 3 : 2),
  );

  return {
    job_size,
    job_complexity,
    estimated_duration,
    estimated_team_size: job_size === "large" ? 3 : 2,
  };
}

export function scopeByCategory(
  categoryInput: string,
  answers: Record<string, unknown>,
): CategoryScopeResult {
  const category = String(categoryInput ?? "").toLowerCase();
  if (category === "tree_felling") return scopeTreeFelling({ answers });
  if (category === "plumbing") return scopePlumbing({ answers });
  if (category === "cleaning") return scopeCleaning({ answers });
  if (category === "rubble_removal") return scopeRubbleRemoval({ answers });
  return scopePlumbing({ answers });
}
