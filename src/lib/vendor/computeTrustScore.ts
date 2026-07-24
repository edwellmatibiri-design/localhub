export type VendorTrustSignals = {
  averageRating: number;
  reviewCount: number;
  recentReviews: number;
  profileCompleteness: number;
  disputeCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function computeTrustScore(signals: VendorTrustSignals): number {
  const averageRating = clamp(Number(signals.averageRating) || 0, 0, 5);
  const reviewCount = clamp(
    Number(signals.reviewCount) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const recentReviews = clamp(
    Number(signals.recentReviews) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const rawProfileCompleteness = Number(signals.profileCompleteness) || 0;
  const profileCompleteness = clamp(rawProfileCompleteness, 0, 100);
  const disputeCount = clamp(
    Number(signals.disputeCount) || 0,
    0,
    Number.MAX_SAFE_INTEGER,
  );

  const averageRatingScore = (averageRating / 5) * 100;
  const reviewCountScore = clamp((reviewCount / 50) * 100, 0, 100);
  const recentReviewsScore = clamp((recentReviews / 20) * 100, 0, 100);
  const profileCompletenessScore = profileCompleteness;
  const disputePenaltyScore = clamp((disputeCount / 10) * 100, 0, 100);

  const weighted =
    averageRatingScore * 0.4 +
    reviewCountScore * 0.2 +
    recentReviewsScore * 0.2 +
    profileCompletenessScore * 0.1 -
    disputePenaltyScore * 0.1;

  return Math.round(clamp(weighted, 0, 100));
}
