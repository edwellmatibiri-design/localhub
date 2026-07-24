export const SEO_RULES = {
  pacing: { maxPagesPerDay: 10, maxPagesPerMonth: 300 },
  quality: {
    minWordCount: 500,
    requireUniqueStructure: true,
    requireUniqueExamples: true,
    requireUniqueCTA: true,
    requireInternalLinks: true,
    forbidSuburbSwapTemplates: true,
  },
  indexing: {
    defaultIndexState: "noindex",
    promoteToIndexAfter: {
      minTraffic: 10,
      minEngagement: 3,
      minListings: 1,
      qualityScore: 0.8,
    },
  },
  generation: {
    requireKeywordVolume: true,
    requireListingsExist: true,
  },
};

export const SEO_CADENCE = {
  daily: ["technical-seo", "internal-links", "listing-rewrites"],
  weekly: ["keyword-discovery", "competitor-gap", "new-service-pages"],
  monthly: ["full-audit", "content-refresh", "schema-improvements"],
};
