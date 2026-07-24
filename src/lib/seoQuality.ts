import { SEO_RULES } from "@/lib/seoRules";

export type SeoQualityResult = {
  score: number;
  pass: boolean;
  reasons: string[];
};

export function scoreSeoContent(content: string): SeoQualityResult {
  const normalized = content.trim();
  const words = normalized ? normalized.split(/\s+/).length : 0;
  const reasons: string[] = [];
  let checks = 0;
  let passed = 0;

  checks += 1;
  if (words >= SEO_RULES.quality.minWordCount) {
    passed += 1;
  } else {
    reasons.push("Content below minimum word count");
  }

  checks += 1;
  if (SEO_RULES.quality.requireUniqueStructure) {
    const hasHeadings =
      /(^|\n)#{1,3}\s+|(^|\n)(overview|services|pricing|faq)\b/im.test(
        normalized,
      );
    if (hasHeadings) {
      passed += 1;
    } else {
      reasons.push("Missing unique structure markers");
    }
  } else {
    passed += 1;
  }

  checks += 1;
  if (SEO_RULES.quality.requireUniqueExamples) {
    const hasExamples = /for example|e\.g\.|example:/i.test(normalized);
    if (hasExamples) {
      passed += 1;
    } else {
      reasons.push("Missing concrete examples");
    }
  } else {
    passed += 1;
  }

  checks += 1;
  if (SEO_RULES.quality.requireUniqueCTA) {
    const hasCta =
      /call now|book now|get a quote|contact us|request a quote/i.test(
        normalized,
      );
    if (hasCta) {
      passed += 1;
    } else {
      reasons.push("Missing clear call-to-action");
    }
  } else {
    passed += 1;
  }

  checks += 1;
  if (SEO_RULES.quality.requireInternalLinks) {
    const hasInternalLinks = /\/category\/|\/suburb\/|\/service\//i.test(
      normalized,
    );
    if (hasInternalLinks) {
      passed += 1;
    } else {
      reasons.push("Missing internal link references");
    }
  } else {
    passed += 1;
  }

  checks += 1;
  if (SEO_RULES.quality.forbidSuburbSwapTemplates) {
    const templateLike =
      /\{suburb\}|\{category\}|\[suburb\]|\[category\]/i.test(normalized);
    if (!templateLike) {
      passed += 1;
    } else {
      reasons.push("Detected suburb-swap template placeholders");
    }
  } else {
    passed += 1;
  }

  const score = checks > 0 ? passed / checks : 0;

  return {
    score,
    pass: score >= SEO_RULES.indexing.promoteToIndexAfter.qualityScore,
    reasons,
  };
}
