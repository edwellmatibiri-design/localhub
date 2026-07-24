import { computeTrustScoreForSeller } from "@/lib/reviewTrust";

type VendorBadge = "Verified" | "Top Rated" | "Responsive" | "Insured";

export type VendorTrust = {
  sellerId: string;
  trustScore: number;
  badges: VendorBadge[];
};

export function calculateVendorTrust(sellerId: string): VendorTrust {
  const trust = computeTrustScoreForSeller(sellerId);
  const badges: VendorBadge[] = [];

  if (trust.reviewCount > 0) badges.push("Verified");
  if (trust.trustScore >= 4.5 && trust.reviewCount >= 3)
    badges.push("Top Rated");
  if (trust.lastReviewAt) badges.push("Responsive");
  if (trust.trustScore >= 4) badges.push("Insured");

  return {
    sellerId,
    trustScore: Number((trust.trustScore * 20).toFixed(2)),
    badges,
  };
}

export function rankListingScore(
  baseQualityScore: number,
  sellerId: string,
): number {
  const trust = calculateVendorTrust(sellerId);
  const trustBoost = Math.min(15, trust.trustScore * 0.15);
  return Math.max(
    0,
    Math.min(100, Number((baseQualityScore + trustBoost).toFixed(2))),
  );
}

export function buildVendorTrustSchema(input: {
  sellerId: string;
  businessName: string;
  url: string;
}) {
  const trust = calculateVendorTrust(input.sellerId);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.businessName,
    url: input.url,
    award: trust.badges,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number((trust.trustScore / 20).toFixed(2)),
      reviewCount: Math.max(1, Math.round(trust.trustScore / 5)),
    },
  };
}
