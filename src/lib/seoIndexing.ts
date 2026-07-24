import { SEO_RULES } from "@/lib/seoRules";

type IndexingCandidate = {
  traffic: number;
  engagement: number;
  listings: number;
  qualityScore: number;
};

export function shouldIndex(page: IndexingCandidate) {
  return (
    page.traffic >= SEO_RULES.indexing.promoteToIndexAfter.minTraffic &&
    page.engagement >= SEO_RULES.indexing.promoteToIndexAfter.minEngagement &&
    page.listings >= SEO_RULES.indexing.promoteToIndexAfter.minListings &&
    page.qualityScore >= SEO_RULES.indexing.promoteToIndexAfter.qualityScore
  );
}
