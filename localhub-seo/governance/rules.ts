export type GovernanceInput = {
  title: string;
  metaDescription: string;
  keywordDensity: number;
};

export type GovernanceResult = {
  compliant: boolean;
  violations: string[];
};

export function enforceSeoRules(input: GovernanceInput): GovernanceResult {
  const violations: string[] = [];

  if (input.title.length < 30 || input.title.length > 70) {
    violations.push("title_length_out_of_bounds");
  }
  if (input.metaDescription.length < 80 || input.metaDescription.length > 180) {
    violations.push("meta_description_length_out_of_bounds");
  }
  if (input.keywordDensity > 0.045) {
    violations.push("keyword_density_too_high");
  }

  return { compliant: violations.length === 0, violations };
}
