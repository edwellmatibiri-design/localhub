export type ComplianceInput = {
  title: string;
  description: string;
  body: string;
  keyword: string;
  schema: unknown[];
};

export type ComplianceResult = {
  pass: boolean;
  score: number;
  reasons: string[];
};

function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

function keywordDensity(text: string, keyword: string): number {
  if (!text.trim() || !keyword.trim()) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi")) ?? [];
  const words = countWords(text);
  return words === 0 ? 0 : matches.length / words;
}

export function validateSeoCompliance(
  input: ComplianceInput,
): ComplianceResult {
  const reasons: string[] = [];
  let checks = 0;
  let passed = 0;

  checks += 1;
  const bodyWordCount = countWords(input.body);
  if (bodyWordCount >= 250) {
    passed += 1;
  } else {
    reasons.push("Content appears thin and may not satisfy user intent.");
  }

  checks += 1;
  const titleDescUnique =
    input.title.toLowerCase() !== input.description.toLowerCase();
  if (titleDescUnique) {
    passed += 1;
  } else {
    reasons.push(
      "Title and description are too similar and look auto-generated.",
    );
  }

  checks += 1;
  const density = keywordDensity(
    `${input.title} ${input.description} ${input.body}`,
    input.keyword,
  );
  if (density <= 0.06) {
    passed += 1;
  } else {
    reasons.push("Keyword stuffing risk detected.");
  }

  checks += 1;
  if (/(fake review|buy links|guaranteed rank #1)/i.test(input.body)) {
    reasons.push("Manipulative or spam-like language detected.");
  } else {
    passed += 1;
  }

  checks += 1;
  if (Array.isArray(input.schema) && input.schema.length > 0) {
    passed += 1;
  } else {
    reasons.push("Structured data schema stack is missing.");
  }

  checks += 1;
  if (/\?|why|how|what|when|which/i.test(input.body)) {
    passed += 1;
  } else {
    reasons.push(
      "Helpfulness signal is weak; add explanatory content or FAQs.",
    );
  }

  const score = checks > 0 ? passed / checks : 0;
  return {
    pass: score >= 0.8,
    score,
    reasons,
  };
}
